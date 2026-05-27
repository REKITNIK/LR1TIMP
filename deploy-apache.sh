#!/bin/bash

# deploy-apache.sh - Деплой медицинской системы на Apache2

echo "🚀 Начинаем деплой медицинской системы на Apache2..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка установки Apache2
if ! command -v apache2 &> /dev/null; then
    echo -e "${YELLOW}Apache2 не установлен. Устанавливаем...${NC}"
    sudo apt update
    sudo apt install apache2 apache2-utils -y
fi

# 2. Включение необходимых модулей
echo -e "${GREEN}📦 Включение модулей Apache...${NC}"
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod ssl
sudo a2enmod expires

# 3. Сборка React приложения
echo -e "${GREEN}📦 Сборка React приложения...${NC}"
cd /path/to/your/project
npm run build

# 4. Создание директорий
echo -e "${GREEN}📁 Создание директорий...${NC}"
sudo mkdir -p /var/www/medical-system
sudo mkdir -p /var/www/medical-system/daemon
sudo mkdir -p /var/www/medical-system/logs

# 5. Копирование файлов
echo -e "${GREEN}📁 Копирование файлов...${NC}"
sudo rm -rf /var/www/medical-system/build
sudo cp -r build /var/www/medical-system/
sudo cp -r daemon/* /var/www/medical-system/daemon/ 2>/dev/null || true

# 6. Копирование .htaccess
echo -e "${GREEN}📄 Настройка .htaccess...${NC}"
if [ -f ".htaccess" ]; then
    sudo cp .htaccess /var/www/medical-system/build/
fi

# 7. Настройка прав доступа
echo -e "${GREEN}🔒 Настройка прав доступа...${NC}"
sudo chown -R www-data:www-data /var/www/medical-system
sudo chmod -R 755 /var/www/medical-system
sudo chmod -R 775 /var/www/medical-system/logs

# 8. Копирование конфигурации сайта
echo -e "${GREEN}⚙️ Настройка виртуального хоста...${NC}"
sudo cp my-site.conf /etc/apache2/sites-available/

# 9. Включение сайта
echo -e "${GREEN}🔌 Включение сайта...${NC}"
sudo a2dissite 000-default.conf 2>/dev/null
sudo a2ensite my-site.conf

# 10. Проверка конфигурации
echo -e "${GREEN}🔍 Проверка конфигурации Apache...${NC}"
if sudo apache2ctl configtest; then
    echo -e "${GREEN}✅ Конфигурация верна${NC}"
    
    # 11. Перезапуск Apache
    echo -e "${GREEN}🔄 Перезапуск Apache...${NC}"
    sudo systemctl restart apache2
    
    echo -e "${GREEN}✨ Деплой завершен успешно!${NC}"
    echo -e "${GREEN}🌐 Сайт доступен по адресу: http://194.87.105.169${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Apache!${NC}"
    exit 1
fi

# 12. Запуск демона
echo -e "${GREEN}🤖 Запуск фонового демона...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart medical-daemon || pm2 start serverDaemon.js --name medical-daemon
    pm2 save
else
    echo -e "${YELLOW}⚠️ PM2 не установлен. Запускаем демона в фоне...${NC}"
    nohup node serverDaemon.js > /var/www/medical-system/logs/daemon.log 2>&1 &
fi

# 13. Проверка статуса
echo ""
echo -e "${GREEN}=== Статус сервера ===${NC}"
sudo systemctl status apache2 --no-pager | grep "Active:"
echo ""
echo -e "${GREEN}=== Проверка API ===${NC}"
curl -s http://localhost:5000/users | head -c 100 || echo "API не отвечает"
echo "..."

echo -e "${GREEN}✅ Готово!${NC}"
