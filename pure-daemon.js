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
        return { users: [], pendingUsers: [] };
    }
}

// Запись БД
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Создание бэкапа
function createBackup() {
    console.log(`[${new Date().toLocaleString()}] 💾 Создание бэкапа...`);
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
                console.log(`🗑️ Удален старый: ${file}`);
            });
        }
    } catch (error) {
        console.error(`❌ Ошибка бэкапа: ${error.message}`);
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
    
    // GET /users
    if (req.method === 'GET' && path === '/users') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.users));
    }
    
    // GET /pendingUsers
    else if (req.method === 'GET' && path === '/pendingUsers') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.pendingUsers));
    }
    
    // POST /users
    else if (req.method === 'POST' && path === '/users') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const newUser = JSON.parse(body);
            const db = readDB();
            newUser.id = Date.now().toString();
            db.users.push(newUser);
            writeDB(db);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newUser));
        });
    }
    
    // PATCH /users/:id
    else if (req.method === 'PATCH' && path.startsWith('/users/')) {
        const id = path.split('/')[2];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updates = JSON.parse(body);
            const db = readDB();
            const userIndex = db.users.findIndex(u => u.id === id);
            
            if (userIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'User not found' }));
                return;
            }
            
            db.users[userIndex] = { ...db.users[userIndex], ...updates };
            writeDB(db);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.users[userIndex]));
        });
    }
    
    // DELETE /users/:id
    else if (req.method === 'DELETE' && path.startsWith('/users/')) {
        const id = path.split('/')[2];
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id === id);
        
        if (userIndex !== -1) {
            db.users.splice(userIndex, 1);
            writeDB(db);
        }
        
        res.writeHead(204);
        res.end();
    }
    
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║     🏥 МЕДИЦИНСКАЯ СИСТЕМА "ЗДОРОВЬЕ"            ║
║          ЧИСТЫЙ Node.js ДЕМОН                    ║
╠══════════════════════════════════════════════════╣
║  📡 Порт: ${PORT}                                      ║
║  🌐 API: http://localhost:${PORT}                      ║
║  📋 Users: http://localhost:${PORT}/users             ║
╠══════════════════════════════════════════════════╣
║  💾 Бэкапы каждые 30 минут                        ║
║  📁 Файлы: backup_YYYY-MM-DD_HH-MM-SS.json       ║
╚══════════════════════════════════════════════════╝
    `);
});

// Автоматические бэкапы каждые 30 минут
setInterval(createBackup, 30 * 60 * 1000);
// Первый бэкап через 10 секунд
setTimeout(createBackup, 10000);

// Остановка демона
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка демона...');
    createBackup();
    console.log('👋 Демон остановлен');
    process.exit(0);
});
