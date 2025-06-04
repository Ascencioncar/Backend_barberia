const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Conexión a PostgreSQL usando variables de entorno automáticamente
const pool = new Pool({
  ssl: {
    rejectUnauthorized: false
  }
});


app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Sistema barbería arriba');

});


app.get('/barberos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM barberos');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en /usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});


// Exportación para Vercel
module.exports = app;

// Levantar el servidor si se ejecuta localmente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}