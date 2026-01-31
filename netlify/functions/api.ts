import { connect } from '@planetscale/database';

// Cached connection configuration check
let cachedConfigKey: string = '';

const getClient = (headers: any) => {
  // 1. Get Credentials from Headers or Env
  const headerHost = headers['x-ps-host'] || headers['X-Ps-Host'];
  const headerUser = headers['x-ps-username'] || headers['X-Ps-Username'];
  const headerPass = headers['x-ps-password'] || headers['X-Ps-Password'];
  
  const envHost = process.env.PS_HOST;
  const envUser = process.env.PS_USERNAME;
  const envPass = process.env.PS_PASSWORD;

  const host = headerHost || envHost;
  const username = headerUser || envUser;
  const password = headerPass || envPass;

  if (!host || !username || !password) {
    throw new Error('PlanetScale credentials are not set (Check Settings or .env)');
  }

  const config = {
    host,
    username,
    password
  };

  return connect(config);
};

export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Ps-Host, X-Ps-Username, X-Ps-Password'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const type = event.queryStringParameters?.type;
    const conn = getClient(event.headers || {});

    // Allowed tables to prevent SQL injection on table name
    const ALLOWED_TABLES = ['notes', 'tasks', 'events'];

    if (!ALLOWED_TABLES.includes(type || '')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type parameter' })
      };
    }

    // GET: Fetch all records from table
    if (event.httpMethod === 'GET') {
      const results = await conn.execute(`SELECT * FROM ${type}`);
      
      // Convert boolean 1/0 to true/false if needed, though frontend handles truthy usually.
      // PlanetScale/MySQL often returns tinyint for boolean.
      const data = results.rows.map((row: any) => {
          if(row.isRecurring !== undefined) row.isRecurring = Boolean(row.isRecurring);
          if(row.isTaskLinked !== undefined) row.isTaskLinked = Boolean(row.isTaskLinked);
          return row;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: data })
      };
    }

    // POST: Overwrite all (Synchronization Mode)
    // PlanetScale doesn't support massive single transactions in HTTP serverless mode easily,
    // but for personal use, we can DELETE then INSERT.
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '[]');
      
      if (!Array.isArray(body)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body must be an array' }) };
      }

      // Step 1: Delete all records
      await conn.execute(`DELETE FROM ${type}`);

      // Step 2: Insert new data (Batch Insert)
      if (body.length > 0) {
        // Construct keys and placeholders
        const keys = Object.keys(body[0]);
        const columns = keys.join(', ');
        
        // PlanetScale driver supports '?' replacement.
        // We will construct: INSERT INTO type (col1, col2) VALUES (?, ?), (?, ?)
        
        const placeholders = `(${keys.map(() => '?').join(', ')})`;
        const allPlaceholders = body.map(() => placeholders).join(', ');
        const query = `INSERT INTO ${type} (${columns}) VALUES ${allPlaceholders}`;
        
        // Flatten values array
        const values: any[] = [];
        body.forEach((item: any) => {
            keys.forEach(key => {
                let val = item[key];
                // Convert boolean true/false to 1/0 for MySQL
                if (typeof val === 'boolean') val = val ? 1 : 0;
                values.push(val);
            });
        });

        await conn.execute(query, values);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch (error: any) {
    console.error('PlanetScale Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || error.toString() })
    };
  }
};