#!/bin/bash

echo "🚀 Запуск сервисов медицинской системы..."

cd /var/www/TIMPLR1MED-main

# Запуск JSON Server
if pgrep -f "json-server.*db.json" > /dev/null; then
    echo "✅ JSON Server уже запущен"
else
    echo "📦 Запуск JSON Server..."
    nohup json-server --watch db.json --port 5000 --host 0.0.0.0 > json-server.log 2>&1 &
    sleep 2
    echo "✅ JSON Server запущен на порту 5000"
fi

# Запуск демона
if pgrep -f "serverDaemon.js" > /dev/null; then
    echo "✅ Демон уже запущен"
else
    echo "🤖 Запуск демона..."
    nohup node serverDaemon.js > daemon.log 2>&1 &
    echo "✅ Демон запущен"
fi

# Проверка Apache
if systemctl is-active --quiet apache2; then
    echo "✅ Apache запущен"
else
    echo "🔄 Запуск Apache..."
    sudo systemctl start apache2
fi

echo ""
echo "✅ Все сервисы запущены!"
echo "🌐 Сайт: http://217.71.129.139:6008"
echo "📊 Статус:"
echo "   - JSON Server: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/users)"
echo "   - Apache: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:6008/)"
