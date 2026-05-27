// monitor.js - мониторинг демона
const http = require('http');

const PORT = 5000;
let isRunning = true;

function checkHealth() {
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/users',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Сервер работает`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Сервер отвечает с кодом ${res.statusCode}`);
        }
    });
    
    req.on('error', (err) => {
        console.log(`[${new Date().toLocaleTimeString()}] ❌ Сервер не доступен: ${err.message}`);
        if (isRunning) {
            console.log('🔄 Попытка перезапуска...');
            // Здесь можно добавить логику перезапуска
        }
    });
    
    req.end();
}

console.log(`🔍 Мониторинг сервера на порту ${PORT} (Ctrl+C для остановки)\n`);
checkHealth();
setInterval(checkHealth, 10000); // Проверка каждые 10 секунд
