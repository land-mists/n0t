import { neon } from '@neondatabase/serverless';

// Helper to get DB client
const getSql = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(dbUrl);
};

export default async (req: Request) => {
  // CORS Headers for development if needed, though redirects handle this in prod
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const sql = getSql();

    if (!['notes', 'tasks', 'events'].includes(type || '')) {
      return new Response(JSON.stringify({ error: 'Invalid type parameter' }), { status: 400, headers });
    }

    // GET: Fetch all records for the type
    if (req.method === 'GET') {
      let query = '';
      if (type === 'notes') query = 'SELECT * FROM notes ORDER BY date DESC';
      if (type === 'tasks') query = 'SELECT * FROM tasks';
      if (type === 'events') query = 'SELECT * FROM events';

      const result = await sql(query);
      
      // Transform keys from snake_case (DB) to camelCase (App) if necessary
      // For simplicity, we assume the DB columns match the JSON keys or we map them here.
      // In this implementation, we are storing the main data as JSONB or columns matching types.
      // To keep it robust with the "saveAll" logic of the frontend, we map simply.
      
      // Let's assume standard columns. We map date fields back to strings if date objects.
      const mappedResult = result.map(row => {
          // Task specific mapping
          if(type === 'tasks') {
             return { ...row, dueDate: row.duedate, priority: row.priority, status: row.status };
          }
          return row;
      });

      return new Response(JSON.stringify({ data: mappedResult }), { status: 200, headers });
    }

    // POST: Overwrite all (Sync strategy matching the frontend 'saveAll' logic)
    // NOTE: In a high-traffic production app, you would use granular INSERT/UPDATE/DELETE.
    // Given the current architecture uses "saveAll", we will replace the user's data for consistency.
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (!Array.isArray(body)) {
        return new Response(JSON.stringify({ error: 'Body must be an array' }), { status: 400, headers });
      }

      // Transaction-like approach: Delete all and re-insert
      // Note: Neon serverless http client doesn't support complex transactions in one go easily without 'transaction()' wrapper 
      // but for this scale, sequential execution is acceptable.

      if (type === 'notes') {
        await sql('DELETE FROM notes'); // Clear table
        if (body.length > 0) {
            // Batch insert
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
            for (const event of body) {
                await sql('INSERT INTO events (id, title, description, start_time, end_time, isrecurring, istasklinked) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                    [event.id, event.title, event.description, event.start, event.end, event.isRecurring, event.isTaskLinked || false]);
            }
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response('Method not allowed', { status: 405, headers });

  } catch (error: any) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};

export const config = {
  path: "/api"
};