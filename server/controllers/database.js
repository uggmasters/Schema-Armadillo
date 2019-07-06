const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'armadillo',
  host: 'localhost',
  database: 'schema-armadillo',
  password: 'pink',
  port: 5432
});

// !!!!!! IMPORTANT: PW NEEDS TO BE LONGER
pool.query(
  'CREATE TABLE IF NOT EXISTS users(user_id SERIAL PRIMARY KEY, username VARCHAR(50), password VARCHAR(100), team_id INT)',
  (err, result) => {
    if (err) return console.error(err);
    console.log('CREATE TABLE users', result);
  }
);

module.exports = pool;
