const jwt = require('jsonwebtoken');
const pool = require('./database');

function convertKeysToSchemas(keys) {
  const schemas = {};
  keys.forEach((key) => {
    schemas[key.schema_name] = schemas[key.schema_name] || { rows: [] };
    schemas[key.schema_name].schema_name = key.schema_name;
    schemas[key.schema_name].user_id = key.user_id;
    schemas[key.schema_name].rows.push(key);
  });
  return Object.values(schemas);
}

const schemaController = {
  checkDuplicate: (req, res, next) => {
    const { schemaName } = req.body;
    const { user_id } = res.locals;

    // search for duplicate
    pool.query('SELECT schema_name FROM schemas WHERE user_id=$1 AND schema_name=$2', [user_id, schemaName])
      .then(({ rows: dupes }) => {
        // if the search result is empty, then there is no duplicate
        if (!dupes.length) {
          return next();
        }

        // remove all the current schemas before adding any new ones
        return pool.query('DELETE FROM schemas WHERE user_id=$1 AND schema_name=$2', [user_id, schemaName])
          // create new schema
          .then(() => next());
      })
      .catch((err) => {
        console.error('error in creating new schema id');
        throw new Error(err);
      });
  },

  createSchema: (req, res, next) => {
    const { user_id } = res.locals;
    const { schemaName, rows } = req.body;

    const queryText = 'INSERT INTO Schemas (user_id, schema_name, key, type, unique_check, required_check) values ($1, $2, $3, $4, $5, $6) RETURNING *;';
    rows.forEach((row) => {
      // iterate thru keys to create rows in the table
      const { key, type, options: { unique, required } } = row;
      // init queryValues array to pass into query
      const queryValues = [
        user_id,
        schemaName,
        key,
        type,
        unique,
        required,
      ];
      pool.query(queryText, queryValues)
        .catch((err) => {
          console.log('error in adding row');
          throw new Error(err);
        });
    });
    res.status(200).send(schemaName);
  },

  // gets one specific schema
  getSchema: (req, res) => {
    const { ssid } = req.cookies;
    const { schema_name } = req.params;


    try {
      // decontructs the result of jwt.verify and uses that user_id to get a specific schema
      const { user_id } = jwt.verify(ssid, 'secretkey');
      pool.query('SELECT * FROM schemas WHERE user_id=$1 AND schema_name=$2', [user_id, schema_name])
        .then(schemaInfo => res.status(200).json(schemaInfo.rows))
        .catch((err) => { throw new Error(err); });
    } catch (err) {
      res.status(500).send('jwt has been tampered with');
    }
  },

  getAllSchema: (req, res, next) => {
    const { ssid } = req.cookies;

    try {
      const { user_id } = jwt.verify(ssid, 'secretkey');

      // if table "schemas" does not exist, create one.
      pool.query(
        `CREATE TABLE IF NOT EXISTS schemas(
        user_id INT,
        schema_name VARCHAR (50),
        key VARCHAR(50),
        type VARCHAR(50),
        unique_check BOOLEAN DEFAULT FALSE,
        required_check BOOLEAN DEFAULT FALSE)`,
      )
        .then(() => pool.query('SELECT * FROM schemas WHERE user_id=$1', [user_id]))
        .then(({ rows }) => {
          res.status(200).send(convertKeysToSchemas(rows));
        })
        .catch(err => res.status(400).send('user doesnt exist'));
    } catch (err) {
      // jwt is malformed
      return res.status(400).send('jwt is malformed');
    }
  },
  deleteSchema: (req, res) => {

    let schemas = req.body
    let queries=  []
    schemas.forEach(schema => {
       queries.push(pool.query('DELETE FROM schemas WHERE user_id=$1 AND schema_name=$2', [schema.user_id, schema.schema_name]))
    })
    Promise.all(queries).then(() => {
      res.status(200).send('Deleted')
    }).catch(() => {
      res.status(500).send('Unable to delete Schema')
    })
  }
}

module.exports = schemaController;
