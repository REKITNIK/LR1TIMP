const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = 5000;
const DB_FILE = 'db.json';

// Чтение БД
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Создаем новую базу данных...');
        return { 
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
    }
}

// Запись БД
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 База данных сохранена (${data.users.length} пользователей)`);
}

// Создание бэкапа
function createBackup() {
    console.log(`[${new Date().toLocaleString()}]  Создание бэкапа...`);
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
        const backupFile = `backup_${timestamp}.json`;
        fs.writeFileSync(backupFile, data);
        console.log(`✅ Бэкап создан: ${backupFile}`);
        
        // Удаляем старые бэкапы (оставляем 5)
        const backups = fs.readdirSync('.')
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .sort();
        
        if (backups.length > 5) {
            const toDelete = backups.slice(0, backups.length - 5);
            toDelete.forEach(file => {
                fs.unlinkSync(file);
                console.log(` Удален старый бэкап: ${file}`);
            });
        }
    } catch (error) {
        console.error(` Ошибка бэкапа: ${error.message}`);
    }
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${path}`);
    
    // GET /users - получить всех пользователей
    if (req.method === 'GET' && path === '/users') {
        const db = readDB();
        // Отправляем без паролей
        const safeUsers = db.users.map(({ password, ...user }) => user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUsers));
    }
    
    // GET /users/:id - получить конкретного пользователя
    else if (req.method === 'GET' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const user = db.users.find(u => u.id === id);
        
        if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Сотрудник не найден' }));
            return;
        }
        
        const { password, ...safeUser } = user;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUser));
    }
    
    // GET /pendingUsers - получить заявки
    else if (req.method === 'GET' && path === '/pendingUsers') {
        const db = readDB();
        const safePending = db.pendingUsers.map(({ password, ...pending }) => pending);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safePending));
    }
    
    // POST /users - создать пользователя
    else if (req.method === 'POST' && path === '/users') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newUser = JSON.parse(body);
                const db = readDB();
                
                // Генерируем новый ID
                const maxId = Math.max(...db.users.map(u => parseInt(u.id)).filter(id => !isNaN(id)), 0);
                newUser.id = (maxId + 1).toString();
                newUser.createdAt = new Date().toISOString();
                
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
    }
    
    // PATCH /users/:id - обновить пользователя
    else if (req.method === 'PATCH' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const updates = JSON.parse(body);
                const db = readDB();
                const userIndex = db.users.findIndex(u => u.id === id);
                
                if (userIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Сотрудник не найден' }));
                    return;
                }
                
                // Обновляем пользователя
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
    }
    
    // DELETE /users/:id - удалить пользователя
    else if (req.method === 'DELETE' && path.match(/^\/users\/\d+$/)) {
        const id = path.split('/')[2];
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Сотрудник не найден' }));
            return;
        }
        
        db.users.splice(userIndex, 1);
        writeDB(db);
        
        res.writeHead(204);
        res.end();
    }
    
    // POST /login - вход в систему
    else if (req.method === 'POST' && path === '/login') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                const db = readDB();
                const user = db.users.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Неверный email или пароль' }));
                    return;
                }
                
                if (!user.isApproved) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Аккаунт не подтвержден' }));
                    return;
                }
                
                const { password: _, ...safeUser } = user;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ user: safeUser, token: `token-${user.id}` }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
    }
    
    // POST /register - регистрация
    else if (req.method === 'POST' && path === '/register') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newUser = JSON.parse(body);
                const db = readDB();
                
                // Проверяем, нет ли такого email
                if (db.users.find(u => u.email === newUser.email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Пользователь с таким email уже существует' }));
                    return;
                }
                
                newUser.id = (db.users.length + 1).toString();
                newUser.role = 'employee';
                newUser.isApproved = false;
                newUser.createdAt = new Date().toISOString();
                
                db.pendingUsers.push(newUser);
                writeDB(db);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Заявка отправлена на рассмотрение' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
    }
    
    // Обработка корневого пути
    else if (req.method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: '🏥 Медицинская система "Здоровье"',
            endpoints: [
                'GET /users',
                'GET /users/:id',
                'POST /users',
                'PATCH /users/:id',
                'DELETE /users/:id',
                'POST /login',
                'POST /register',
                'GET /pendingUsers'
            ]
        }));
    }
    
    // 404 для всех остальных запросов
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Маршрут ${path} не найден` }));
    }
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🏥 МЕДИЦИНСКАЯ СИСТЕМА "ЗДОРОВЬЕ"                        ║
║          ИСПРАВЛЕННЫЙ ДЕМОН ЗАПУЩЕН                          ║
╠══════════════════════════════════════════════════════════════╣
║  📡 Порт: ${PORT}                                                  ║
║  🌐 API: http://localhost:${PORT}                                  ║
║  📋 Все сотрудники: http://localhost:${PORT}/users                ║
║  👤 Конкретный сотрудник: http://localhost:${PORT}/users/1        ║
╠══════════════════════════════════════════════════════════════╣
║  💾 Бэкапы создаются каждые 30 минут                          ║
║  📁 Файлы бэкапов: backup_YYYY-MM-DD_HH-MM-SS.json           ║
╠══════════════════════════════════════════════════════════════╣
║  👤 ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ:                                    ║
║  • Админ: anna@hospital.ru / admin123                        ║
║  • Врач:  sergey@hospital.ru / doctor123                     ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Автоматические бэкапы каждые 30 минут
setInterval(createBackup, 30 * 60 * 1000);
// Первый бэкап через 10 секунд
setTimeout(createBackup, 10000);

// Остановка демона
process.on('SIGINT', () => {
    console.log('\n\n Остановка демона...');
    createBackup();
    console.log(' Демон остановлен. До свидания!');
    process.exit(0);
});
