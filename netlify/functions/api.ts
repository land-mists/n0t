import { neon } from '@neondatabase/serverless';

// Helper to get DB client
const getSql = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(dbUrl);
};

// Standard Netlify Function Handler (AWS Lambda style)
export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight options request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    const type = event.queryStringParameters?.type;
    
    // Connect to Neon
    const sql = getSql();

    if (!['notes', 'tasks', 'events'].includes(type || '')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type parameter' })
      };
    }

    // GET: Fetch all records for the type
    if (event.httpMethod === 'GET') {
      let query = '';
      if (type === 'notes') query = 'SELECT * FROM notes ORDER BY date DESC';
      if (type === 'tasks') query = 'SELECT * FROM tasks';
      if (type === 'events') query = 'SELECT * FROM events';

      const result = await sql(query);
      
      const mappedResult = result.map((row: any) => {
          if(type === 'tasks') {
             return { ...row, dueDate: row.duedate, priority: row.priority, status: row.status };
          }
          return row;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: mappedResult })
      };
    }

    // POST: Overwrite all
    if (event.httpMethod === 'POST') {
      // event.body is a string in Lambda-style functions
      const body = JSON.parse(event.body || '[]');
      
      if (!Array.isArray(body)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Body must be an array' })
        };
      }

      if (type === 'notes') {
        await sql('DELETE FROM notes'); 
        if (body.length > 0) {
            for (const note of body) {
                await sql('INSERT INTO notes (id, title, content, date, color) VALUES ($1, $2, $3, $4, $5)', 
                    [note.id, note.title, note.content, note.date, note.color]);
            }
        }
      }

      if (type === 'tasks') {
        await sql('DELETE FROM tasks');
        if (body.length > 0) {
            for (const task of body) {
                await sql('INSERT INTO tasks (id, title, description, duedate, priority, status, color) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                    [task.id, task.title, task.description, task.dueDate, task.priority, task.status, task.color]);
            }
        }
      }

      if (type === 'events') {
        await sql('DELETE FROM events');
        if (body.length > 0) {
            for (const item of body) {
                await sql('INSERT INTO events (id, title, description, start_time, end_time, isrecurring, istasklinked) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                    [item.id, item.title, item.description, item.start, item.end, item.isRecurring, item.isTaskLinked || false]);
            }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: 'Method not allowed'
    };

  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};