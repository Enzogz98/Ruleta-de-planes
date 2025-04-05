const mysql = require('mysql2/promise');

exports.handler = async function(event, context) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await connection.execute('SELECT texto FROM opciones');
  await connection.end();

  return {
    statusCode: 200,
    body: JSON.stringify(rows.map(r => r.texto))
  };
};
