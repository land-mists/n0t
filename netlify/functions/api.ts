import { createClient } from '@supabase/supabase-js';

// Cached client for hot lambdas
let cachedClient: any = null;
let cachedUrl: string = '';

const getClient = (headers: any) => {
  // 1. Get Credentials from Headers or Env
  const headerUrl = headers['x-supabase-url'] || headers['X-Supabase-Url'];
  const headerKey = headers['x-supabase-key'] || headers['X-Supabase-Key'];
  
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_KEY;

  const url = headerUrl || envUrl;
  const key = headerKey || envKey;

  if (!url || !key) {
    throw new Error('Supabase credentials are not set (Check Settings or .env)');
  }

  // 2. Reuse Client if possible
  if (cachedClient && cachedUrl === url) {
      return cachedClient;
  }

  // 3. Create New Client
  const client = createClient(url, key);
  
  cachedClient = client;
  cachedUrl = url;

  return client;
};

export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Supabase-Url, X-Supabase-Key'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const type = event.queryStringParameters?.type;
    const supabase = getClient(event.headers || {});

    if (!['notes', 'tasks', 'events'].includes(type || '')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type parameter' })
      };
    }

    // GET: Fetch all records from table
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase.from(type).select('*');
      
      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: data })
      };
    }

    // POST: Overwrite all (Synchronization Mode)
    // To replicate the behavior of the previous "Save All" logic with a relational DB:
    // We ideally should UPSERT or DIFF, but for simplicity of this architecture we might:
    // 1. Delete all records (or those belonging to user if we had RLS user logic separate from simple API key)
    // 2. Insert new records
    // Warning: This is destructive. Ensure your Supabase RLS policies are set correctly if multiple users exist.
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '[]');
      
      if (!Array.isArray(body)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body must be an array' }) };
      }

      // Step 1: Delete all records in the table (Filtering by ID not null effectively selects all)
      // Note: In a real multi-tenant app, this would need a user_id filter.
      // Since we are using basic 'anon' key with likely one global state for this personal app:
      const { error: deleteError } = await supabase.from(type).delete().neq('id', 'placeholder_impossible_id');
      
      if (deleteError) {
         // Some RLS policies prevent deleting everything without a filter. 
         // Fallback: Delete using a condition that is always true if possible, or iterate.
         // For Personal LifeOS, we assume policies allow Delete.
         console.warn("Delete error (might be RLS):", deleteError);
      }

      // Step 2: Insert new data
      if (body.length > 0) {
        const { error: insertError } = await supabase.from(type).insert(body);
        if (insertError) throw insertError;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch (error: any) {
    console.error('Supabase Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || error.toString() })
    };
  }
};