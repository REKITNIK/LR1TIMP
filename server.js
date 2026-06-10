const express = require('express');
const jsonServer = require('json-server');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'db.json');

// Инициализация базы данных с начальными данными
const initializeDatabase = () => {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      users: [
        {
          id: "1",
          name: "Анна Иванова",
          email: "anna@hospital.ru",
          password: "admin123",
          role: "admin",
          isApproved: true,
          position: "Главный врач",
          department: "Администрация",
          phone: "+7 (999) 123-45-67",
          avatar: "👩‍⚕️",
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          name: "Сергей Петров",
          email: "sergey@hospital.ru",
          password: "doctor123",
          role: "doctor",
          isApproved: true,
          position: "Врач-терапевт",
          department: "Терапия",
          phone: "+7 (999) 234-56-78",
          avatar: "👨‍⚕️",
          createdAt: new Date().toISOString()
        }
      ],
      pendingUsers: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    console.log('✅ База данных инициализирована');
  }
};

// Функция для чтения базы данных
const readDatabase = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Функция для записи в базу данных
const writeDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Логгер запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

//  API 

// Получить всех пользователей
app.get('/api/users', (req, res) => {
  try {
    const db = readDatabase();
    const users = db.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
});

// Получить пользователя по ID
app.get('/api/users/:id', (req, res) => {
  try {
    const db = readDatabase();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении пользователя' });
  }
});

// Создать нового пользователя (регистрация)
app.post('/api/users', (req, res) => {
  try {
    const db = readDatabase();
    const { email, password, name, position, department, phone } = req.body;
    
    // Проверяем, существует ли пользователь
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: 'employee',
      isApproved: false,
      position,
      department,
      phone: phone || '',
      avatar: name.charAt(0),
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDatabase(db);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании пользователя' });
  }
});

// Обновить пользователя
app.patch('/api/users/:id', (req, res) => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Обновляем только разрешенные поля
    const allowedUpdates = ['name', 'position', 'department', 'phone', 'avatar', 'rang'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    writeDatabase(db);
    
    const { password, ...userWithoutPassword } = db.users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
  }
});

// Удалить пользователя
app.delete('/api/users/:id', (req, res) => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    db.users.splice(userIndex, 1);
    writeDatabase(db);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
});

// Вход в систему
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDatabase();
    
    const user = db.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    if (!user.isApproved) {
      return res.status(403).json({ error: 'Ваша заявка еще не подтверждена администратором' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token: `mock-token-${user.id}` });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при входе в систему' });
  }
});

// Регистрация (создание заявки)
app.post('/api/register', (req, res) => {
  try {
    const db = readDatabase();
    const { name, email, password, position, department, phone } = req.body;
    
    // Проверяем, не зарегистрирован ли уже пользователь
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Проверяем, нет ли уже заявки
    if (db.pendingUsers.find(p => p.email === email)) {
      return res.status(400).json({ error: 'Заявка с таким email уже отправлена' });
    }
    
    const newPendingUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: 'employee',
      position,
      department,
      phone: phone || '',
      avatar: name.charAt(0),
      createdAt: new Date().toISOString()
    };
    
    db.pendingUsers.push(newPendingUser);
    writeDatabase(db);
    
    res.status(201).json({ 
      message: 'Заявка отправлена на рассмотрение администратору',
      pendingId: newPendingUser.id 
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// Получить все заявки
app.get('/api/pending-users', (req, res) => {
  try {
    const db = readDatabase();
    const pendingWithoutPassword = db.pendingUsers.map(pending => {
      const { password, ...pendingWithoutPassword } = pending;
      return pendingWithoutPassword;
    });
    res.json(pendingWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Подтвердить заявку
app.post('/api/approve-user/:id', (req, res) => {
  try {
    const db = readDatabase();
    const pendingIndex = db.pendingUsers.findIndex(p => p.id === req.params.id);
    
    if (pendingIndex === -1) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    const pendingUser = db.pendingUsers[pendingIndex];
    
    // Создаем утвержденного пользователя
    const newUser = {
      ...pendingUser,
      isApproved: true,
      approvedAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    db.pendingUsers.splice(pendingIndex, 1);
    writeDatabase(db);
    
    const { password, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при подтверждении заявки' });
  }
});

// Отклонить заявку
app.delete('/api/pending-users/:id', (req, res) => {
  try {
    const db = readDatabase();
    const pendingIndex = db.pendingUsers.findIndex(p => p.id === req.params.id);
    
    if (pendingIndex === -1) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    db.pendingUsers.splice(pendingIndex, 1);
    writeDatabase(db);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при отклонении заявки' });
  }
});

// Статистика системы
app.get('/api/stats', (req, res) => {
  try {
    const db = readDatabase();
    const stats = {
      totalUsers: db.users.length,
      approvedUsers: db.users.filter(u => u.isApproved).length,
      pendingUsers: db.pendingUsers.length,
      admins: db.users.filter(u => u.role === 'admin').length,
      doctors: db.users.filter(u => u.role === 'doctor').length,
      employees: db.users.filter(u => u.role === 'employee').length,
      departments: [...new Set(db.users.map(u => u.department).filter(Boolean))],
      lastUpdated: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Автоматический бэкап базы данных
const backupDatabase = () => {
  try {
    const db = readDatabase();
    const backupPath = path.join(__dirname, `backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(db, null, 2));
    console.log(`✅ Бэкап создан: ${backupPath}`);
    
    // Удаляем старые бэкапы (оставляем только 5 последних)
    const backups = fs.readdirSync(__dirname)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backups.length > 5) {
      backups.slice(5).forEach(backup => {
        fs.unlinkSync(path.join(__dirname, backup));
        console.log(`🗑️ Удален старый бэкап: ${backup}`);
      });
    }
  } catch (error) {
    console.error('❌ Ошибка при создании бэкапа:', error);
  }
};

// Запуск бэкапа каждые 30 минут
setInterval(backupDatabase, 30 * 60 * 1000);

// Инициализация и запуск сервера
initializeDatabase();

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     🏥 МЕДИЦИНСКАЯ СИСТЕМА "ЗДОРОВЬЕ"            ║
║     Сервер успешно запущен!                      ║
╠══════════════════════════════════════════════════╣
║  📡 Порт: ${PORT}                                      ║
║  🌐 API: http://localhost:${PORT}/api               ║
╠══════════════════════════════════════════════════╣
║  📋 Доступные эндпоинты:                         ║
║  • GET    /api/users          - все сотрудники   ║
║  • GET    /api/users/:id      - сотрудник по ID  ║
║  • POST   /api/users          - создать          ║
║  • PATCH  /api/users/:id      - обновить         ║
║  • DELETE /api/users/:id      - удалить          ║
║  • POST   /api/login          - вход             ║
║  • POST   /api/register       - регистрация      ║
║  • GET    /api/stats          - статистика       ║
╠══════════════════════════════════════════════════╣
║  👤 Тестовые аккаунты:                           ║
║  • Админ: anna@hospital.ru / admin123            ║
║  • Врач:  sergey@hospital.ru / doctor123         ║
╚══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Получен сигнал завершения. Сервер останавливается...');
  backupDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n Получен сигнал завершения. Сервер останавливается...');
  backupDatabase();
  process.exit(0);
});
