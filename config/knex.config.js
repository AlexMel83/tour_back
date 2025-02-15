import knex from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  IS_DOCKER,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_PORT,
  POSTGRES_HOST,
} = process.env;
const DB_HOST = IS_DOCKER ? 'postgres' : POSTGRES_HOST;
const db = knex({
  client: 'pg',
  connection: {
    host: DB_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
  },
});
try {
  // check connection to DB
  db.raw('SELECT 1')
    .then(() => {
      console.log('Connected to the database on ' + DB_HOST + ' successfully!');
    })
    .catch((err) => {
      console.error('Failed to connect to the database:', err.message);
      if (err.code === 'ECONNREFUSED') {
        console.error('Connection refused. Please check your database server.');
      }
      // close connection
      db.destroy();
    });
} catch (error) {
  console.error('Error initializing database connection:', error.message);
  throw error;
}
export default db;
