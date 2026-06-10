const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DB_FILE = 'db.json';

// Чтение БД
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`📖 Загружено: ${parsed.users?.length || 0} пользователей, ${parsed.devices?.length || 0} устройств, ${parsed.pendingUsers?.length || 0} заявок`);
        return parsed;
    } catch (error) {
        console.log('⚠️ Ошибка чтения БД, создаем новую...');
        return { 
            devices: [
                {
                    id: "1",
                    name: "МРТ Томограф Siemens",
                    type: "medical",
                    category: "Диагностическое оборудование",
                    ipAddress: "192.168.1.101",
                    macAddress: "00:1A:2B:3C:4D:5E",
                    location: "Кабинет МРТ, 2 этаж",
                    department: "Радиология",
                    status: "online",
                    power: "on",
                    lastSeen: new Date().toISOString(),
                    manufacturer: "Siemens",
                    model: "MAGNETOM Vida",
                    createdAt: new Date().toISOString()
                }
            ],
            users: [
                {
                    id: "1",
                    name: "Анна Иванова",
                    email: "anna@hospital.ru",
                    password: "admin123",
                    role: "admin",
                    isApproved: true,
                    createdAt: new Date().toISOString()
                }
            ],
            pendingUsers: [],
            deviceLogs: []
        };
    }
}

// Запись БД
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        console.log(`💾 БД сохранена (${data.users?.length || 0} пользователей, ${data.devices?.length || 0} устройств)`);
    } catch (error) {
        console.error('❌ Ошибка записи БД:', error.message);
    }
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${path}`);
    
    // ===== МАРШРУТЫ ДЛЯ УСТРОЙСТВ =====
    
    // GET /devices - получить все устройства
    if (req.method === 'GET' && path === '/devices') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.devices || []));
        return;
    }
    
    // GET /devices/:id - получить устройство по ID
    if (req.method === 'GET' && path.match(/^\/devices\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const device = (db.devices || []).find(d => d.id === id);
        
        if (!device) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Устройство не найдено' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(device));
        return;
    }
    
    // POST /devices - создать устройство
    if (req.method === 'POST' && path === '/devices') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newDevice = JSON.parse(body);
                const db = readDB();
                
                const maxId = Math.max(...(db.devices || []).map(d => parseInt(d.id)).filter(id => !isNaN(id)), 0);
                newDevice.id = (maxId + 1).toString();
                newDevice.createdAt = new Date().toISOString();
                newDevice.lastSeen = new Date().toISOString();
                newDevice.status = newDevice.status || 'offline';
                newDevice.power = newDevice.power || 'off';
                
                db.devices = db.devices || [];
                db.devices.push(newDevice);
                writeDB(db);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newDevice));
            } catch (error) {
                console.error('Ошибка:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // PATCH /devices/:id - обновить устройство
    if (req.method === 'PATCH' && path.match(/^\/devices\/\d+$/)) {
        const id = path.split('/')[2];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const updates = JSON.parse(body);
                const db = readDB();
                const deviceIndex = (db.devices || []).findIndex(d => d.id === id);
                
                if (deviceIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Устройство не найдено' }));
                    return;
                }
                
                db.devices[deviceIndex] = { ...db.devices[deviceIndex], ...updates, lastSeen: new Date().toISOString() };
                writeDB(db);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(db.devices[deviceIndex]));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // DELETE /devices/:id - удалить устройство
    if (req.method === 'DELETE' && path.match(/^\/devices\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const deviceIndex = (db.devices || []).findIndex(d => d.id === id);
        
        if (deviceIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Устройство не найдено' }));
            return;
        }
        
        db.devices.splice(deviceIndex, 1);
        writeDB(db);
        
        res.writeHead(204);
        res.end();
        return;
    }
    
    // ===== МАРШРУТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====
    
    // GET /users - получить всех пользователей
    if (req.method === 'GET' && path === '/users') {
        const db = readDB();
        const safeUsers = (db.users || []).map(({ password, ...user }) => user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUsers));
        return;
    }
    
    // GET /users/:id - получить пользователя по ID
    if (req.method === 'GET' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const user = (db.users || []).find(u => u.id === id);
        
        if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Пользователь не найден' }));
            return;
        }
        
        const { password, ...safeUser } = user;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUser));
        return;
    }
    
    // POST /users - создать пользователя
    if (req.method === 'POST' && path === '/users') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newUser = JSON.parse(body);
                const db = readDB();
                
                const maxId = Math.max(...(db.users || []).map(u => parseInt(u.id)).filter(id => !isNaN(id)), 0);
                newUser.id = (maxId + 1).toString();
                newUser.createdAt = new Date().toISOString();
                
                db.users = db.users || [];
                db.users.push(newUser);
                writeDB(db);
                
                const { password, ...safeUser } = newUser;
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(safeUser));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // PATCH /users/:id - обновить пользователя
    if (req.method === 'PATCH' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const updates = JSON.parse(body);
                const db = readDB();
                const userIndex = (db.users || []).findIndex(u => u.id === id);
                
                if (userIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Пользователь не найден' }));
                    return;
                }
                
                db.users[userIndex] = { ...db.users[userIndex], ...updates };
                writeDB(db);
                
                const { password, ...safeUser } = db.users[userIndex];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(safeUser));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // DELETE /users/:id - удалить пользователя
    if (req.method === 'DELETE' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        console.log(`🗑️ DELETE запрос на удаление пользователя ID: ${id}`);
        
        const db = readDB();
        const userIndex = (db.users || []).findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            console.log('❌ Пользователь не найден');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Пользователь не найден' }));
            return;
        }
        
        const deletedUser = db.users[userIndex];
        
        // Защита от удаления последнего администратора
        if (deletedUser.role === 'admin') {
            const adminCount = (db.users || []).filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                console.log('❌ Нельзя удалить последнего администратора');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Нельзя удалить последнего администратора' }));
                return;
            }
        }
        
        db.users.splice(userIndex, 1);
        writeDB(db);
        
        console.log(`✅ Пользователь ${deletedUser.name} (ID: ${id}) удален`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Пользователь удален', user: deletedUser }));
        return;
    }
    
    // ===== МАРШРУТЫ ДЛЯ АВТОРИЗАЦИИ =====
    
    // POST /login - вход в систему
    if (req.method === 'POST' && path === '/login') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                console.log(`🔐 Попытка входа: ${email}`);
                
                const db = readDB();
                const user = (db.users || []).find(u => u.email === email && u.password === password);
                
                if (!user) {
                    console.log('❌ Пользователь не найден');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Неверный email или пароль' }));
                    return;
                }
                
                if (!user.isApproved) {
                    console.log('❌ Пользователь не подтвержден');
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Аккаунт не подтвержден' }));
                    return;
                }
                
                console.log(`✅ Успешный вход: ${user.name}`);
                const { password: _, ...safeUser } = user;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(safeUser));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // GET /pendingUsers - получить заявки
    if (req.method === 'GET' && path === '/pendingUsers') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.pendingUsers || []));
        return;
    }
    
    // POST /pendingUsers - создать заявку (регистрация)
    if (req.method === 'POST' && path === '/pendingUsers') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newPending = JSON.parse(body);
                const db = readDB();
                
                if ((db.users || []).find(u => u.email === newPending.email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Пользователь с таким email уже существует' }));
                    return;
                }
                
                if ((db.pendingUsers || []).find(p => p.email === newPending.email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Заявка с таким email уже отправлена' }));
                    return;
                }
                
                newPending.id = Date.now().toString();
                newPending.createdAt = new Date().toISOString();
                newPending.isApproved = false;
                
                db.pendingUsers = db.pendingUsers || [];
                db.pendingUsers.push(newPending);
                writeDB(db);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Заявка отправлена на рассмотрение' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // DELETE /pendingUsers/:id - удалить заявку
    if (req.method === 'DELETE' && path.match(/^\/pendingUsers\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const pendingIndex = (db.pendingUsers || []).findIndex(p => p.id === id);
        
        if (pendingIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Заявка не найдена' }));
            return;
        }
        
        db.pendingUsers.splice(pendingIndex, 1);
        writeDB(db);
        
        res.writeHead(204);
        res.end();
        return;
    }
    
    // ===== СТАТИСТИКА =====
    
    // GET /stats - статистика
    if (req.method === 'GET' && path === '/stats') {
        const db = readDB();
        const stats = {
            totalDevices: (db.devices || []).length,
            onlineDevices: (db.devices || []).filter(d => d.status === 'online' && d.power === 'on').length,
            totalUsers: (db.users || []).length,
            pendingUsers: (db.pendingUsers || []).length,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
    }
    
    // ===== КОРНЕВОЙ ПУТЬ =====
    
    if (req.method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: '🏥 Медицинская система "Здоровье"',
            version: '2.0',
            endpoints: [
                '📡 УСТРОЙСТВА:',
                '  GET    /devices           - список устройств',
                '  GET    /devices/:id       - устройство по ID',
                '  POST   /devices           - добавить устройство',
                '  PATCH  /devices/:id       - обновить устройство',
                '  DELETE /devices/:id       - удалить устройство',
                '',
                '👥 ПОЛЬЗОВАТЕЛИ:',
                '  GET    /users             - список пользователей',
                '  GET    /users/:id         - пользователь по ID',
                '  POST   /users             - создать пользователя',
                '  PATCH  /users/:id         - обновить пользователя',
                '  DELETE /users/:id         - удалить пользователя',
                '',
                '🔐 АВТОРИЗАЦИЯ:',
                '  POST   /login             - вход в систему',
                '  GET    /pendingUsers      - список заявок',
                '  POST   /pendingUsers      - создание заявки',
                '  DELETE /pendingUsers/:id  - удалить заявку',
                '',
                '📊 СТАТИСТИКА:',
                '  GET    /stats             - статистика системы'
            ]
        }));
        return;
    }
    
    // 404
    console.log(`❌ Маршрут не найден: ${path}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Маршрут ${path} не найден` }));
});

// Запуск сервера
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║     🏥 МЕДИЦИНСКАЯ СИСТЕМА "ЗДОРОВЬЕ" - УПРАВЛЕНИЕ УСТРОЙСТВАМИ          ║
║                          ВЕРСИЯ 2.0                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  📡 Порт: ${PORT}                                                               ║
║  🌐 API: http://0.0.0.0:${PORT}                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  ✅ ДОСТУПНЫЕ МАРШРУТЫ:                                                    ║
║  • GET    /devices        - список устройств                              ║
║  • POST   /devices        - добавить устройство                           ║
║  • PATCH  /devices/:id    - обновить устройство                           ║
║  • DELETE /devices/:id    - удалить устройство                            ║
║  • GET    /users          - список пользователей                          ║
║  • POST   /users          - создать пользователя                          ║
║  • PATCH  /users/:id      - обновить пользователя                         ║
║  • DELETE /users/:id      - удалить пользователя                          ║
║  • POST   /login          - вход в систему                                ║
║  • GET    /pendingUsers   - список заявок                                 ║
║  • POST   /pendingUsers   - создание заявки                               ║
║  • DELETE /pendingUsers/:id - удалить заявку                              ║
║  • GET    /stats          - статистика                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  👤 ТЕСТОВЫЕ ДАННЫЕ:                                                      ║
║  • Админ: anna@hospital.ru / admin123                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    server.close(() => {
        console.log('👋 Сервер остановлен');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка сервера...');
    server.close(() => {
        console.log('👋 Сервер остановлен');
        process.exit(0);
    });
});
