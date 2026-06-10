// server-pg.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Настройки PostgreSQL
const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'medical_incident_db',
  password: 'mypassword',
  port: 5432,
});

app.use(cors());
app.use(express.json());

// ---------- Swagger конфигурация ----------
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical System API',
      version: '1.0.0',
      description: 'API для управления пользователями, устройствами и инцидентами',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./server-pg.js'], // путь к текущему файлу
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Middleware аутентификации JWT ----------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Middleware для проверки роли администратора
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ---------- Вспомогательные функции ----------
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// ---------- Эндпоинты (без защиты) ----------

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Аутентификация пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT токен и данные пользователя
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isapproved) {
      return res.status(403).json({ error: 'Account not approved' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /pendingUsers:
 *   post:
 *     summary: Регистрация новой заявки (пароль хешируется)
 */
app.post('/pendingUsers', async (req, res) => {
  const { name, email, password, role, position, department, phone, avatar } = req.body;
  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 UNION SELECT id FROM pendingUsers WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User or pending request already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
// сохраняем hashedPassword в поле password таблицы pendingUsers
    const result = await pool.query(
      `INSERT INTO pendingUsers (name, email, password, role, position, department, phone, avatar, createdat, isapproved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, false) RETURNING *`,
      [name, email, hashedPassword, role || 'employee', position, department, phone, avatar]
    );
    res.status(201).json({ message: 'Registration request sent' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ---------- Защищённые эндпоинты (требуют JWT) ----------

// GET /users – с пагинацией
/**
 * @swagger
 * /users:
 *   get:
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 */
app.get('/users', authenticateToken, async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT id, name, email, role, isapproved, position, department, phone, avatar, createdat FROM users ORDER BY id LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
app.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, isapproved, position, department, phone, avatar, createdat FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users – создание пользователя (только админ)
app.post('/users', authenticateToken, isAdmin, async (req, res) => {
  const { name, email, password, role, isapproved, position, department, phone, avatar } = req.body;
  try {
    // Проверка на дубликат
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    // Вставляем, НЕ хешируя пароль повторно
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, isapproved, position, department, phone, avatar, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) RETURNING *`,
      [name, email, password, role, isapproved, position, department, phone, avatar]
    );
    const { password: _, ...safeUser } = result.rows[0];
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id
app.patch('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // запрещаем менять пароль через этот эндпоинт (для простоты)
  delete updates.password;
  const fields = Object.keys(updates).map((key, i) => `${key} = $${i+1}`).join(', ');
  const values = Object.values(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No data to update' });
  try {
    const result = await pool.query(
      `UPDATE users SET ${fields} WHERE id = $${values.length+1} RETURNING id, name, email, role, isapproved, position, department, phone, avatar, createdat`,
      [...values, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /users/:id – только админ
app.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (userRes.rows[0].role === 'admin') {
      const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Аналогично для /devices (GET, POST, PATCH, DELETE) – добавить пагинацию и защиту
// GET /devices с пагинацией
app.get('/devices', authenticateToken, async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT * FROM devices ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    const countResult = await pool.query('SELECT COUNT(*) FROM devices');
    const total = parseInt(countResult.rows[0].count);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/:id
app.get('/devices/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /devices – только админ
app.post('/devices', authenticateToken, isAdmin, async (req, res) => {
  const { name, type, category, ipaddress, macaddress, location, department, manufacturer, model, serialnumber } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO devices (name, type, category, ipaddress, macaddress, location, department, manufacturer, model, serialnumber, status, power, lastseen, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'offline', 'off', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [name, type, category, ipaddress, macaddress, location, department, manufacturer, model, serialnumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /devices/:id – только админ
app.patch('/devices/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates.lastSeen;
  delete updates.lastseen;
  const fields = Object.keys(updates).map((key, i) => `${key} = $${i+1}`).join(', ');
  const values = Object.values(updates);
  try {
    let result;
    if (fields.length > 0) {
      result = await pool.query(
        `UPDATE devices SET ${fields}, lastseen = CURRENT_TIMESTAMP WHERE id = $${values.length+1} RETURNING *`,
        [...values, id]
      );
    } else {
      result = await pool.query(`UPDATE devices SET lastseen = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id]);
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /devices/:id – только админ
app.delete('/devices/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint для статистики (не защищён, можно оставить открытым)
app.get('/stats', async (req, res) => {
  try {
    const devices = await pool.query('SELECT COUNT(*) FROM devices');
    const online = await pool.query('SELECT COUNT(*) FROM devices WHERE status = $1 AND power = $2', ['online', 'on']);
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const pending = await pool.query('SELECT COUNT(*) FROM pendingUsers');
    res.json({
      totalDevices: parseInt(devices.rows[0].count),
      onlineDevices: parseInt(online.rows[0].count),
      totalUsers: parseInt(users.rows[0].count),
      pendingUsers: parseInt(pending.rows[0].count),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /pendingUsers:
 *   get:
 *     summary: Получить список заявок (только админ)
 *     security: [{ bearerAuth: [] }]
 */
app.get('/pendingUsers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pendingUsers ORDER BY createdat DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /pendingUsers/:id – удалить заявку (админ)
 */
app.delete('/pendingUsers/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM pendingUsers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    res.status(204).send(); // успешно, без тела
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Эндпоинты для инцидентов (оставляем без изменений, но можно защитить) ----------
app.get('/incidents', async (req, res) => { /* ... */ });
// ... остальные инциденты

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
