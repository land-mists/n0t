import { MongoClient } from 'mongodb';

// Cached connection for hot lambdas
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

const getClient = async (headers: any) => {
  // 1. Get Connection String
  const headerId = headers['x-database-id'] || headers['X-Database-Id'];
  const envUrl = process.env.DATABASE_URL;
  const uri = headerId || envUrl;

  if (!uri) {
    throw new Error('Database URI is not set (Check Settings for Database ID or .env)');
  }

  // 2. Reuse Connection if possible and if URI matches (handling dynamic switching)
  if (cachedClient && cachedClient.s && (cachedClient.s as any).url === uri) {
      return { client: cachedClient, db: cachedDb };
  }

  // 3. Close old connection if URI changed (rare edge case in single-user app)
  if (cachedClient) {
      await cachedClient.close();
  }

  // 4. Create New Connection
  const client = new MongoClient(uri);
  await client.connect();
  
  // Parse DB name from URI or default to 'lifeos'
  const urlObj = new URL(uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
  const dbName = urlObj.pathname.substring(1) || 'lifeos';
  
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
};

export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Database-Id'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const type = event.queryStringParameters?.type;
    const { db } = await getClient(event.headers || {});

    if (!['notes', 'tasks', 'events'].includes(type || '')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type parameter' })
      };
    }

    const collection = db.collection(type);

    // GET: Fetch all records
    if (event.httpMethod === 'GET') {
      const result = await collection.find({}).toArray();
      
      // Clean up Mongo specific _id if needed, but frontend expects 'id' string which we store manually
      const mappedResult = result.map((doc: any) => {
          // Ensure we return the 'id' field expected by frontend
          // We strip _id to avoid confusion or pass it along if needed
          const { _id, ...rest } = doc;
          return { ...rest }; 
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: mappedResult })
      };
    }

    // POST: Overwrite all (Synchronization Mode)
    // In a real production app, we would do diffing, but for this LifeOS "Save All" approach:
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '[]');
      
      if (!Array.isArray(body)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body must be an array' }) };
      }

      // Transaction-like replacement: Delete All -> Insert All
      // Note: MongoDB Atlas Free Tier doesn't support multi-document transactions easily without replica set setup,
      // so we do it sequentially.
      await collection.deleteMany({});
      
      if (body.length > 0) {
        // Ensure we preserve the frontend 'id'
        await collection.insertMany(body);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};