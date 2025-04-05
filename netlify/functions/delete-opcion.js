const mysql = require('mysql2/promise');

exports.handler = async function(event) {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  const { texto } = JSON.parse(event.body);

  if (!texto) {
    return { statusCode: 400, body: 'Falta el campo "texto"' };
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.execute('DELETE FROM opciones WHERE texto = ?', [texto]);
    await connection.end();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Opción eliminada' })
    };
  } catch (error) {
    await connection.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
