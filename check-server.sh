#!/bin/bash

echo "🔍 Проверка настроек сервера..."
echo "================================"

# Проверяем систему
echo "📅 Время системы: $(date)"
echo "👤 Пользователь: $(whoami)"
echo "📁 Текущая директория: $(pwd)"

# Проверяем Docker
echo ""
echo "🐳 Проверка Docker:"
if command -v docker &> /dev/null; then
    echo "✅ Docker установлен: $(docker --version)"
else
    echo "❌ Docker не установлен"
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose установлен: $(docker-compose --version)"
else
    echo "❌ Docker Compose не установлен"
fi

# Проверяем Git
echo ""
echo "📦 Проверка Git:"
if command -v git &> /dev/null; then
    echo "✅ Git установлен: $(git --version)"
else
    echo "❌ Git не установлен"
fi

# Проверяем директорию проекта
echo ""
echo "📁 Проверка директории проекта:"
if [ -d "/var/www/support-bday" ]; then
    echo "✅ Директория /var/www/support-bday существует"
    cd /var/www/support-bday
    echo "📁 Содержимое директории:"
    ls -la
    
    if [ -f "docker-compose.yml" ]; then
        echo "✅ docker-compose.yml найден"
    else
        echo "❌ docker-compose.yml не найден"
    fi
    
    if [ -d ".git" ]; then
        echo "✅ Git репозиторий найден"
        echo "🔗 Git remotes:"
        git remote -v
        echo "📊 Статус Git:"
        git status
    else
        echo "❌ Git репозиторий не найден"
    fi
else
    echo "❌ Директория /var/www/support-bday не существует"
    echo "📁 Содержимое /var/www:"
    ls -la /var/www/
fi

# Проверяем контейнеры
echo ""
echo "📦 Проверка Docker контейнеров:"
if [ -f "/var/www/support-bday/docker-compose.yml" ]; then
    cd /var/www/support-bday
    echo "📊 Статус контейнеров:"
    docker-compose ps
    
    echo ""
    echo "📋 Логи приложения:"
    docker-compose logs --tail=10 app
    
    echo ""
    echo "📋 Логи Nginx:"
    docker-compose logs --tail=10 nginx
else
    echo "❌ docker-compose.yml не найден"
fi

# Проверяем порты
echo ""
echo "🌐 Проверка портов:"
echo "Порт 80 (HTTP):"
netstat -tlnp | grep :80 || echo "❌ Порт 80 не слушается"
echo "Порт 443 (HTTPS):"
netstat -tlnp | grep :443 || echo "❌ Порт 443 не слушается"
echo "Порт 3000 (Next.js):"
netstat -tlnp | grep :3000 || echo "❌ Порт 3000 не слушается"

echo ""
echo "✅ Проверка завершена!" 