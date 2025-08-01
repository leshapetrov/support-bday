#!/bin/bash

# Скрипт автоматического деплоя
echo "🚀 Начинаем деплой..."
echo "📅 Время: $(date)"
echo "👤 Пользователь: $(whoami)"

# Переходим в директорию проекта
cd /var/www/support-bday
echo "📁 Директория проекта: $(pwd)"

# Проверяем статус Git
echo "🔍 Проверяем статус Git..."
git status
git remote -v

# Получаем последние изменения из Git
echo "📥 Получаем последние изменения..."
git fetch origin
git reset --hard origin/main

# Останавливаем текущие контейнеры
echo "📦 Останавливаем контейнеры..."
docker-compose down || echo "⚠️ Контейнеры уже остановлены"

# Пересобираем образы
echo "🔨 Пересобираем образы..."
docker-compose build --no-cache

# Запускаем новые контейнеры
echo "🚀 Запускаем новые контейнеры..."
docker-compose up -d

# Ждем запуска контейнеров
echo "⏳ Ждем запуска контейнеров..."
sleep 10

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose ps

# Очищаем неиспользуемые образы
echo "🧹 Очищаем неиспользуемые образы..."
docker system prune -f

echo "✅ Деплой завершен успешно!"

# Проверяем доступность сайта
echo "🌐 Проверяем доступность сайта..."
curl -I http://localhost:80 || echo "⚠️ HTTP недоступен"
curl -I https://localhost:443 || echo "⚠️ HTTPS недоступен" 