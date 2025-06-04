// app.js
// ------------------
// Proyecto Node.js para la API de la barbería, con CORS habilitado.
// Utiliza Express y pg para conectar a PostgreSQL.
// ------------------

const express = require('express');
const cors = require('cors');            // 1) Importar cors
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// =====================================================
// 2) Configurar CORS ANTES de cualquier ruta
//    Permitir todos los orígenes (útil en desarrollo).
//    En producción, podrías limitar sólo a tu frontend:
//      app.use(cors({ origin: 'https://tu-frontend.vercel.app' }));
// =====================================================
app.use(cors());

// =====================================================
// 3) Middlewares
//    Parsear JSON en body de peticiones
// =====================================================
app.use(express.json());

// =====================================================
// 4) Configuración de conexión a PostgreSQL
//
//    Asume que en tu .env tienes definidas:
//      PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
// =====================================================
const pool = new Pool({
  ssl: {
    rejectUnauthorized: false
  }
});



// =====================================================
// 5) RUTA RAÍZ (para comprobar que el servidor arranca)
// =====================================================
app.get('/', (req, res) => {
  res.send('Sistema barbería arriba');
});



// =====================================================
// 6) ENDPOINTS PARA “barberos” (CRUD completo)
// =====================================================

// a) Listar todos los barberos
app.get('/barberos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM barberos ORDER BY id_barbero');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /barberos:', error);
    res.status(500).json({ error: 'Error al obtener datos de barberos' });
  }
});

// b) Obtener un barbero por ID
app.get('/barberos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT * FROM barberos WHERE id_barbero = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en GET /barberos/:id:', error);
    res.status(500).json({ error: 'Error al obtener barbero por ID' });
  }
});

// c) Crear un nuevo barbero
app.post('/barberos', async (req, res) => {
  const { nombre, especialidad } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
  }
  try {
    const insertQuery = `
      INSERT INTO barberos (nombre, especialidad)
      VALUES ($1, $2)
      RETURNING id_barbero, nombre, especialidad
    `;
    const result = await pool.query(insertQuery, [nombre, especialidad || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /barberos:', error);
    res.status(500).json({ error: 'Error al crear nuevo barbero' });
  }
});

// d) Actualizar un barbero (nombre o especialidad)
app.put('/barberos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, especialidad } = req.body;
  if (!nombre && !especialidad) {
    return res.status(400).json({ error: 'Debe enviar al menos "nombre" o "especialidad" para actualizar' });
  }
  try {
    // Verificar que exista
    const existing = await pool.query('SELECT * FROM barberos WHERE id_barbero = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    // Armar query dinámico
    const fieldsToUpdate = [];
    const values = [];
    let idx = 1;
    if (nombre) {
      fieldsToUpdate.push(`nombre = $${idx++}`);
      values.push(nombre);
    }
    if (especialidad) {
      fieldsToUpdate.push(`especialidad = $${idx++}`);
      values.push(especialidad);
    }
    values.push(id);

    const updateQuery = `
      UPDATE barberos
         SET ${fieldsToUpdate.join(', ')}
       WHERE id_barbero = $${idx}
       RETURNING id_barbero, nombre, especialidad
    `;
    const result = await pool.query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en PUT /barberos/:id:', error);
    res.status(500).json({ error: 'Error al actualizar barbero' });
  }
});

// e) Eliminar un barbero
app.delete('/barberos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('DELETE FROM barberos WHERE id_barbero = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }
    res.json({ mensaje: 'Barbero eliminado correctamente', barbero: result.rows[0] });
  } catch (error) {
    console.error('Error en DELETE /barberos/:id:', error);
    res.status(500).json({ error: 'Error al eliminar barbero' });
  }
});



// =====================================================
// 7) ENDPOINTS PARA “clientes” (CRUD completo)
// =====================================================

// a) Listar todos los clientes
app.get('/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id_cliente');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /clientes:', error);
    res.status(500).json({ error: 'Error al obtener datos de clientes' });
  }
});

// b) Obtener un cliente por ID
app.get('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en GET /clientes/:id:', error);
    res.status(500).json({ error: 'Error al obtener cliente por ID' });
  }
});

// c) Crear un nuevo cliente
app.post('/clientes', async (req, res) => {
  const { nombre, telefono, correo } = req.body;
  if (!nombre || !telefono || !correo) {
    return res.status(400).json({ error: 'Debe enviar nombre, teléfono y correo' });
  }
  try {
    const insertQuery = `
      INSERT INTO clientes (nombre, telefono, correo)
      VALUES ($1, $2, $3)
      RETURNING id_cliente, nombre, telefono, correo
    `;
    const result = await pool.query(insertQuery, [nombre, telefono, correo]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /clientes:', error);
    // Capturar violación de UNIQUE (teléfono o correo duplicado)
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un cliente con ese teléfono o correo' });
    } else {
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  }
});

// d) Actualizar un cliente (nombre, teléfono o correo)
app.put('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, telefono, correo } = req.body;
  if (!nombre && !telefono && !correo) {
    return res.status(400).json({ error: 'Debe enviar al menos un campo para actualizar' });
  }
  try {
    // Verificar existencia
    const existing = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Armar query dinámico
    const fieldsToUpdate = [];
    const values = [];
    let idx = 1;
    if (nombre) {
      fieldsToUpdate.push(`nombre = $${idx++}`);
      values.push(nombre);
    }
    if (telefono) {
      fieldsToUpdate.push(`telefono = $${idx++}`);
      values.push(telefono);
    }
    if (correo) {
      fieldsToUpdate.push(`correo = $${idx++}`);
      values.push(correo);
    }
    values.push(id);

    const updateQuery = `
      UPDATE clientes
         SET ${fieldsToUpdate.join(', ')}
       WHERE id_cliente = $${idx}
       RETURNING id_cliente, nombre, telefono, correo
    `;
    const result = await pool.query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en PUT /clientes/:id:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un cliente con ese teléfono o correo' });
    } else {
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  }
});

// e) Eliminar un cliente
app.delete('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id_cliente = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ mensaje: 'Cliente eliminado correctamente', cliente: result.rows[0] });
  } catch (error) {
    console.error('Error en DELETE /clientes/:id:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});



// =====================================================
// 8) ENDPOINTS PARA “bloqueos_barbero”
// =====================================================

// a) Listar bloqueos (opcional filtrar por id_barbero y/o fecha)
//    Ejemplo: GET /bloqueos?barberoId=2&fecha=2025-06-13
app.get('/bloqueos', async (req, res) => {
  const { barberoId, fecha } = req.query;
  const conditions = [];
  const values = [];

  if (barberoId) {
    values.push(parseInt(barberoId, 10));
    conditions.push(`id_barbero = $${values.length}`);
  }
  if (fecha) {
    values.push(fecha); // 'YYYY-MM-DD'
    conditions.push(`fecha = $${values.length}`);
  }

  let query = 'SELECT * FROM bloqueos_barbero';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY fecha, hora_inicio';

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /bloqueos:', error);
    res.status(500).json({ error: 'Error al obtener bloqueos' });
  }
});

// b) Crear un nuevo bloqueo
app.post('/bloqueos', async (req, res) => {
  const { id_barbero, fecha, hora_inicio, hora_fin, motivo } = req.body;
  if (!id_barbero || !fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'Debe enviar id_barbero, fecha, hora_inicio y hora_fin' });
  }

  try {
    // 1) Verificar solapamientos con bloqueos activos
    const overlapQuery = `
      SELECT 1
        FROM bloqueos_barbero
       WHERE id_barbero = $1
         AND fecha = $2
         AND estado = 'activo'
         AND NOT (hora_fin <= $3 OR hora_inicio >= $4)
    `;
    const overlapResult = await pool.query(overlapQuery, [id_barbero, fecha, hora_inicio, hora_fin]);
    if (overlapResult.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe otro bloqueo en esa franja horaria para este barbero' });
    }

    // 2) Insertar el bloqueo
    const insertQuery = `
      INSERT INTO bloqueos_barbero (id_barbero, fecha, hora_inicio, hora_fin, motivo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      id_barbero,
      fecha,
      hora_inicio,
      hora_fin,
      motivo || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /bloqueos:', error);
    res.status(500).json({ error: 'Error al crear bloqueo' });
  }
});

// c) Eliminar (desactivar) un bloqueo
app.delete('/bloqueos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query(
      `UPDATE bloqueos_barbero
         SET estado = 'inactivo'
       WHERE id_bloqueo = $1
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    res.json({ mensaje: 'Bloqueo desactivado', bloqueo: result.rows[0] });
  } catch (error) {
    console.error('Error en DELETE /bloqueos/:id:', error);
    res.status(500).json({ error: 'Error al eliminar bloqueo' });
  }
});



// =====================================================
// 9) ENDPOINTS PARA “reservas”
// =====================================================

// a) Listar todas las reservas (opcional filtrar por clienteId, barberoId, fecha)
app.get('/reservas', async (req, res) => {
  const { clienteId, barberoId, fecha } = req.query;
  const conditions = [];
  const values = [];

  if (clienteId) {
    values.push(parseInt(clienteId, 10));
    conditions.push(`r.id_cliente = $${values.length}`);
  }
  if (barberoId) {
    values.push(parseInt(barberoId, 10));
    conditions.push(`r.id_barbero = $${values.length}`);
  }
  if (fecha) {
    values.push(fecha);
    conditions.push(`r.fecha = $${values.length}`);
  }

  let query = `
    SELECT
      r.id_reserva,
      r.id_cliente,
      c.nombre   AS cliente_nombre,
      r.id_barbero,
      b.nombre   AS barbero_nombre,
      r.servicio_nombre,
      r.servicio_precio,
      r.fecha,
      r.hora,
      r.estado
    FROM reservas r
    JOIN clientes c  ON r.id_cliente = c.id_cliente
    JOIN barberos b  ON r.id_barbero = b.id_barbero
  `;
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY r.fecha, r.hora';

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// b) Obtener una reserva por su ID
app.get('/reservas/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const query = `
      SELECT
        r.id_reserva,
        r.id_cliente,
        c.nombre   AS cliente_nombre,
        r.id_barbero,
        b.nombre   AS barbero_nombre,
        r.servicio_nombre,
        r.servicio_precio,
        r.fecha,
        r.hora,
        r.estado
      FROM reservas r
      JOIN clientes c  ON r.id_cliente = c.id_cliente
      JOIN barberos b  ON r.id_barbero = b.id_barbero
      WHERE r.id_reserva = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en GET /reservas/:id:', error);
    res.status(500).json({ error: 'Error al obtener reserva por ID' });
  }
});

// c) Crear una nueva reserva
app.post('/reservas', async (req, res) => {
  const { cliente, reserva } = req.body;
  /**
   * Se espera que el frontend envíe en el body un JSON así:
   * {
   *   "cliente": {
   *     "nombre": "Carlos Andrés",
   *     "correo": "carlos@example.com",
   *     "telefono": "3001234567"
   *   },
   *   "reserva": {
   *     "servicio_nombre": "Corte De Cabello",
   *     "servicio_precio": 18000.00,
   *     "id_barbero": 1,
   *     "fecha": "2025-06-05",       // YYYY-MM-DD
   *     "hora": "10:00:00"           // HH:MM:SS
   *   }
   * }
   */
  if (
    !cliente ||
    !cliente.nombre ||
    !cliente.correo ||
    !cliente.telefono ||
    !reserva ||
    !reserva.servicio_nombre ||
    reserva.servicio_precio == null ||
    !reserva.id_barbero ||
    !reserva.fecha ||
    !reserva.hora
  ) {
    return res.status(400).json({ error: 'Datos incompletos para crear reserva' });
  }

  const {
    nombre: cliNombre,
    correo: cliCorreo,
    telefono: cliTelefono
  } = cliente;

  const {
    servicio_nombre,
    servicio_precio,
    id_barbero,
    fecha,
    hora
  } = reserva;

  // 1) Upsert de cliente: si ya existe por correo o teléfono, lo obtenemos y, si no existe, lo creamos
  let id_cliente;
  try {
    // a) Intento de insertar nuevo cliente
    const insertClienteQuery = `
      INSERT INTO clientes (nombre, telefono, correo)
      VALUES ($1, $2, $3)
      RETURNING id_cliente
    `;
    const insertResult = await pool.query(insertClienteQuery, [cliNombre, cliTelefono, cliCorreo]);
    id_cliente = insertResult.rows[0].id_cliente;
  } catch (error) {
    // Si hay violación de UNIQUE (23505), significa que ya existe un cliente con ese correo o teléfono.
    if (error.code === '23505') {
      // Buscar al cliente existente por correo o teléfono
      const selectQuery = `
        SELECT id_cliente
          FROM clientes
         WHERE correo = $1 OR telefono = $2
         LIMIT 1
      `;
      const selectResult = await pool.query(selectQuery, [cliCorreo, cliTelefono]);
      if (selectResult.rows.length === 0) {
        // Esto no debería pasar, pero por seguridad:
        return res.status(500).json({ error: 'Error inesperado al buscar cliente existente' });
      }
      id_cliente = selectResult.rows[0].id_cliente;

      // Opcional: podrías actualizar nombre si cambió
      const updateQuery = `
        UPDATE clientes
           SET nombre = $1
         WHERE id_cliente = $2
      `;
      await pool.query(updateQuery, [cliNombre, id_cliente]);
    } else {
      console.error('Error en upsert cliente:', error);
      return res.status(500).json({ error: 'Error al procesar datos de cliente' });
    }
  }

  try {
    // 2) Verificar que el barbero esté libre en ese día/hora:
    //    (a) Primero verificamos bloqueos:
    const bloqueoCheckQuery = `
      SELECT 1
        FROM bloqueos_barbero
       WHERE id_barbero = $1
         AND fecha = $2
         AND estado = 'activo'
         AND $3::time >= hora_inicio
         AND $3::time < hora_fin
    `;
    const bloqueoResult = await pool.query(bloqueoCheckQuery, [id_barbero, fecha, hora]);
    if (bloqueoResult.rows.length > 0) {
      return res.status(409).json({
        error: 'El barbero tiene un bloqueo activo en esa fecha y hora'
      });
    }

    //    (b) Luego verificamos si ya existe una reserva confirmada EXACTA para ese barbero a la misma fecha y hora
    const reservaCheckQuery = `
      SELECT 1
        FROM reservas
       WHERE id_barbero = $1
         AND fecha = $2
         AND hora = $3
         AND estado = 'confirmado'
    `;
    const reservaCheckResult = await pool.query(reservaCheckQuery, [id_barbero, fecha, hora]);
    if (reservaCheckResult.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una reserva confirmada para ese barbero en la misma fecha y hora'
      });
    }

    // 3) Insertar la nueva reserva
    const insertReservaQuery = `
      INSERT INTO reservas (
        id_cliente,
        id_barbero,
        servicio_nombre,
        servicio_precio,
        fecha,
        hora,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmado')
      RETURNING *
    `;
    const insertReservaResult = await pool.query(insertReservaQuery, [
      id_cliente,
      id_barbero,
      servicio_nombre,
      servicio_precio,
      fecha,
      hora
    ]);

    res.status(201).json({
      mensaje: 'Reserva creada correctamente',
      reserva: insertReservaResult.rows[0]
    });
  } catch (error) {
    console.error('Error en POST /reservas:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// d) Cancelar (marcar como “cancelado”) una reserva
app.delete('/reservas/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // Simplemente actualizamos el campo “estado” a 'cancelado'
    const query = `
      UPDATE reservas
         SET estado = 'cancelado'
       WHERE id_reserva = $1
       RETURNING *
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json({ mensaje: 'Reserva cancelada', reserva: result.rows[0] });
  } catch (error) {
    console.error('Error en DELETE /reservas/:id:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});



// =====================================================
// 10) EXPORTACIÓN PARA VERCEL Y ARRANQUE LOCAL
// =====================================================
module.exports = app;

// Si se ejecuta directamente con `node app.js`, se levanta el servidor en local:
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}
