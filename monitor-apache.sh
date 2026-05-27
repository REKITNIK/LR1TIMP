#!/bin/bash

# monitor-apache.sh - Мониторинг Apache сервера

echo "=== Медицинская система - Статус Apache ==="
echo ""

# Статус Apache
echo "📊 Статус Apache:"
sudo systemctl status apache2 --no-pager | grep "Active:"

# Загруженные модули
echo ""
echo "🔌 Загруженные модули:"
apache2ctl -M | grep -E "(rewrite|proxy|headers|deflate|ssl)" | head -10

# Подключенные сайты
echo ""
echo "🌐 Активные сайты:"
ls -la /etc/apache2/sites-enabled/

# Последние логи
echo ""
echo "📝 Последние логи доступа:"
tail -n 10 /var/log/apache2/medical-system-access.log

echo ""
echo "❌ Последние ошибки:"
tail -n 5 /var/log/apache2/medical-system-error.log

# Статистика памяти
echo ""
echo "💾 Использование памяти Apache:"
ps aux | grep apache2 | grep -v grep | awk '{sum+=$6} END {print sum/1024 " MB"}'

# Проверка API
echo ""
echo "🌐 Проверка API через proxy:"
curl -s http://localhost/api/users | head -c 100 2>/dev/null || echo "API proxy не работает"
echo "..."

# Проверка демона
echo ""
echo "🤖 Статус демона:"
if command -v pm2 &> /dev/null; then
    pm2 status medical-daemon
else
    ps aux | grep serverDaemon.js | grep -v grep || echo "Демон не запущен"
fi
