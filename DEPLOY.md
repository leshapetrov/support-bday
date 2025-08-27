# 🚀 Инструкция по деплою на Timeweb Cloud

## 📋 Подготовка к деплою

### 1. Настройка GitHub репозитория

1. **Создайте репозиторий на GitHub** (если еще не создан)
2. **Загрузите код в репозиторий:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/support-bday.git
   git push -u origin main
   ```

### 2. Настройка GitHub Secrets

В настройках репозитория (`Settings` → `Secrets and variables` → `Actions`) добавьте:

- `HOST` - IP адрес вашего сервера Timeweb Cloud
- `USERNAME` - имя пользователя на сервере (обычно `root`)
- `SSH_KEY` - приватный SSH ключ для доступа к серверу
- `PORT` - порт SSH (обычно `22`)


### 3. Подготовка сервера Timeweb Cloud

#### Установка необходимого ПО:

```bash
# Обновляем системку
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Устанавливаем Git
sudo apt install git -y

# Устанавливаем Nginx (если не используете Docker)
sudo apt install nginx -y
```

#### Создание директории проекта:

```bash
# Создаем директорию для проекта
sudo mkdir -p /var/www/support-bday
sudo chown $USER:$USER /var/www/support-bday
cd /var/www/support-bday

# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/support-bday.git .
```

#### Настройка SSL сертификатов:

```bash
# Создаем директорию для SSL
sudo mkdir -p /var/www/support-bday/ssl

# Генерируем самоподписанный сертификат (для тестирования)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /var/www/support-bday/ssl/key.pem \
  -out /var/www/support-bday/ssl/cert.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Support/CN=your-domain.com"
```

### 4. Первый запуск

```bash
cd /var/www/support-bday

# Делаем скрипт деплоя исполняемым
chmod +x deploy.sh

# Запускаем приложение
docker-compose up -d

# Проверяем статус
docker-compose ps
```

## 🔄 Автоматический деплой

После настройки GitHub Actions, каждый пуш в ветку `main` будет автоматически:

1. Подключаться к серверу по SSH
2. Получать последние изменения из Git
3. Пересобирать Docker образы
4. Перезапускать контейнеры
5. Очищать неиспользуемые образы

### Диагностика деплоя:

Если деплой не работает, проверьте:

1. **GitHub Secrets** - убедитесь, что все секреты настроены правильно
2. **SSH доступ** - проверьте, что SSH ключ работает
3. **Логи GitHub Actions** - в репозитории перейдите в `Actions` → выберите workflow → `Deploy to Timeweb Cloud`
4. **Тест SSH соединения** - запустите workflow `Test SSH Connection` вручную

### Ручной запуск деплоя:

Если автоматический деплой не срабатывает, можно запустить вручную:

```bash
# На сервере
cd /var/www/support-bday
./deploy.sh
```

### Проверка настроек сервера:

Для диагностики проблем используйте скрипт проверки:

```bash
# На сервере
cd /var/www/support-bday
chmod +x check-server.sh
./check-server.sh
```

Этот скрипт проверит:
- Установку Docker и Docker Compose
- Настройки Git репозитория
- Статус контейнеров
- Открытые порты
- Логи приложения

## 🌐 Настройка домена

### 1. В панели Timeweb:

1. **Перейдите в раздел "Домены"**
2. **Добавьте ваш домен**
3. **Настройте DNS записи:**
   - Тип: `A`
   - Имя: `@` (или поддомен)
   - Значение: IP адрес вашего сервера

### 2. На сервере:

```bash
# Обновляем nginx.conf с вашим доменом
sudo nano /var/www/support-bday/nginx.conf

# Перезапускаем контейнеры
cd /var/www/support-bday
docker-compose restart nginx
```

### 3. SSL сертификат Let's Encrypt:

```bash
# Устанавливаем Certbot
sudo apt install certbot -y

# Получаем сертификат
sudo certbot certonly --standalone -d your-domain.com

# Копируем сертификаты
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /var/www/support-bday/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /var/www/support-bday/ssl/key.pem

# Перезапускаем Nginx
docker-compose restart nginx
```

## 📊 Мониторинг

### Проверка статуса:

```bash
# Статус контейнеров
docker-compose ps

# Логи приложения
docker-compose logs app

# Логи Nginx
docker-compose logs nginx
```

### Автоматическое обновление SSL:

```bash
# Добавляем в crontab
sudo crontab -e

# Добавляем строку для обновления каждые 60 дней
0 0 1 */2 * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /var/www/support-bday/ssl/cert.pem && cp /etc/letsencrypt/live/your-domain.com/privkey.pem /var/www/support-bday/ssl/key.pem && cd /var/www/support-bday && docker-compose restart nginx
```

## 🔧 Устранение неполадок

### Если деплой не работает:

1. **Проверьте GitHub Secrets:**
   - `HOST` - IP адрес сервера
   - `USERNAME` - имя пользователя (обычно `root`)
   - `SSH_KEY` - приватный SSH ключ
   - `PORT` - порт SSH (обычно `22`)

2. **Проверьте SSH доступ:**
   ```bash
   ssh -i your_private_key username@your_server_ip
   ```

3. **Проверьте директорию проекта:**
   ```bash
   ls -la /var/www/support-bday
   ```

4. **Проверьте Git репозиторий:**
   ```bash
   cd /var/www/support-bday
   git status
   git remote -v
   ```

### Если приложение не запускается:

```bash
# Проверяем логи
docker-compose logs app

# Пересобираем образы
docker-compose build --no-cache

# Перезапускаем
docker-compose up -d
```

### Если Nginx не работает:

```bash
# Проверяем конфигурацию
docker-compose exec nginx nginx -t

# Проверяем логи
docker-compose logs nginx
```

### Если GitHub Actions не запускаются:

1. **Проверьте права доступа к репозиторию**
2. **Убедитесь, что ветка называется `main`**
3. **Проверьте, что файлы `.github/workflows/` находятся в репозитории**
4. **Запустите workflow вручную для диагностики**

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь, что все порты открыты в Timeweb Cloud
3. Проверьте настройки DNS
4. Убедитесь, что SSL сертификаты корректны 