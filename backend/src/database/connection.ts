import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export class Database {
  private static instance: Pool;

  static getInstance(): Pool {
    if (!this.instance) {
      const connectionConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false,
            },
          }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'inventory_db',
          };

      this.instance = new Pool(connectionConfig);

      this.instance.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
      });
    }
    return this.instance;
  }

  static async getConnection(): Promise<PoolClient> {
    return this.getInstance().connect();
  }

 static async query<T extends QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return this.getInstance().query<T>(text, params);
}

  static async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.end();
    }
  }
}
