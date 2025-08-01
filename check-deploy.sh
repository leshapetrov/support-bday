#!/bin/bash

echo "🔍 Проверка состояния деплоя..."

# Проверяем текущую директорию
echo "📁 Текущая директория: $(pwd)"

# Проверяем Git статус
echo "📊 Git статус:"
git status --porcelain

# Проверяем последний коммит
echo "📝 Последний коммит:"
git log --oneline -1

# Проверяем Docker контейнеры
echo "🐳 Статус Docker контейнеров:"
docker-compose ps

# Проверяем логи приложения
echo "📋 Последние логи приложения:"
docker-compose logs --tail=10 app

# Проверяем логи Nginx
echo "📋 Последние логи Nginx:"
docker-compose logs --tail=10 nginx

# Проверяем использование диска
echo "💾 Использование диска:"
df -h

# Проверяем использование памяти
echo "🧠 Использование памяти:"
free -h

echo "✅ Проверка завершена!" 