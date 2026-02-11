# Развертывание PDFtour-creator-2 на VPS

Инструкция по развертыванию приложения на VPS (в том числе Hostinger) с использованием GitHub Actions, GHCR, Docker Compose и Nginx.

---

## 1. Требования к VPS

- **ОС:** Ubuntu 20.04+ или Debian 11+ (рекомендуется для скриптов установки)
- **Ресурсы:** минимум 1 GB RAM, 1 vCPU; для стабильной генерации PDF рекомендуется 2 GB RAM
- **Доступ:** SSH с ключом (рекомендуется) или по паролю
- **Сеть:** открытый порт 22 (SSH), при использовании Nginx — порты 80 и 443

---

## 2. Установка зависимостей на VPS

На сервере нужно один раз выполнить первоначальную настройку.

### 2.1 Подключение по SSH

```bash
ssh root@ВАШ_IP_VPS
# или
ssh ваш_пользователь@ВАШ_IP_VPS
```

### 2.2 Запуск скрипта настройки VPS

Склонируйте репозиторий (или скопируйте только скрипт) и выполните:

```bash
# Если репозиторий уже склонирован в /opt/pdftour-creator-2:
cd /opt/pdftour-creator-2
sudo chmod +x scripts/setup-vps.sh
sudo ./scripts/setup-vps.sh
```

Скрипт **setup-vps.sh** выполняет:

- установку Docker и плагина Docker Compose (Ubuntu/Debian);
- создание директорий приложения, данных и логов;
- настройку прав доступа;
- проверку директорий Nginx (если Nginx установлен).

Переменные окружения (при необходимости):

| Переменная       | По умолчанию              | Описание                          |
|------------------|---------------------------|-----------------------------------|
| `APP_DIR`        | `/opt/pdftour-creator-2`  | Корневая директория приложения   |
| `DATA_DIR`       | `$APP_DIR/data`           | Данные (в т.ч. pricing config)   |
| `LOG_DIR`        | `$APP_DIR/logs`           | Логи                              |
| `NGINX_CONF_DIR` | `/etc/nginx/sites-available` | Каталог конфигов Nginx        |

Пример с другими путями:

```bash
APP_DIR=/opt/pdf-service DATA_DIR=/opt/pdf-service/data sudo ./scripts/setup-vps.sh
```

После выполнения скрипта переходите к настройке окружения и деплою.

---

## 3. Настройка переменных окружения

### 3.1 На VPS (в директории приложения)

В корне проекта на VPS создайте файл `.env`, если нужны переменные помимо дефолтных:

```bash
cd /opt/pdftour-creator-2
nano .env
```

Пример (при необходимости изменить под себя):

```env
NODE_ENV=production
PORT=3000
```

Директория `data` используется для хранения `pricingConfig.json`; при первом запуске её создаст `docker-compose` через volume. Если папки нет — создайте вручную:

```bash
mkdir -p /opt/pdftour-creator-2/data
chown -R "$USER:$USER" /opt/pdftour-creator-2/data
```

### 3.2 Для скрипта деплоя (на вашей машине)

Для запуска `scripts/deploy.sh` задайте переменные (или положите их в `.env.deploy` и сделайте `source .env.deploy`):

| Переменная   | Обязательно | Описание                    |
|-------------|-------------|-----------------------------|
| `VPS_HOST`  | Да          | IP или домен VPS            |
| `VPS_USER`  | Нет         | Пользователь SSH (по умолчанию: `root`) |
| `VPS_PORT`  | Нет         | Порт SSH (по умолчанию: `22`) |
| `APP_DIR`   | Нет         | Путь на VPS (по умолчанию: `/opt/pdftour-creator-2`) |
| `IMAGE_TAG` | Нет         | Тег образа для деплоя (по умолчанию: `latest`) |
| `IMAGE_NAME`| Нет         | Имя образа, если нужно переопределить default из `docker-compose.yml` |
| `GHCR_USER` | Нет         | Логин GHCR (нужен для приватного image) |
| `GHCR_TOKEN`| Нет         | Token GHCR с правом `read:packages` |
| `GIT_SYNC_ENABLED` | Нет  | Включает git sync при отсутствии `docker-compose.yml` (по умолчанию: `false`) |
| `REPO_URL`  | Нет         | URL репозитория (нужен только при `GIT_SYNC_ENABLED=true`) |
| `BRANCH`    | Нет         | Ветка для git sync (по умолчанию: `main`) |

Опционально — healthcheck:

| Переменная                     | По умолчанию                    | Описание              |
|--------------------------------|----------------------------------|-----------------------|
| `HEALTHCHECK_URL`              | `http://localhost:3004/api/pdf` | URL для проверки      |
| `HEALTHCHECK_EXPECTED_STATUS`  | `405`                           | Ожидаемый HTTP статус |
| `HEALTHCHECK_TIMEOUT_SECONDS`  | `120`                           | Таймаут проверки (с)  |
| `HEALTHCHECK_INTERVAL_SECONDS` | `5`                             | Интервал между проверками (с) |

---

## 4. Релизный процесс (build в CI, deploy на VPS)

Рекомендуемый процесс двухфазный:

1. `docker-publish.yml` собирает image в CI и публикует в GHCR с тегами:
   - `latest` (для main),
   - `sha-<short_sha>` (для immutable rollback).
2. `deploy-vps.yml` (manual) разворачивает выбранный `image_tag` на VPS через `docker compose pull && docker compose up -d`.

### 4.1 Публикация image в GHCR

- Автоматически: `push` в `main`.
- Вручную: запуск `Build and Push Docker image to GHCR` через `workflow_dispatch`.

### 4.2 Деплой конкретного тега через GitHub Actions (рекомендуется)

1. Откройте workflow `Deploy to VPS (GHCR image)`.
2. Нажмите `Run workflow`.
3. Передайте `image_tag`:
   - `latest` для обычного релиза;
   - `sha-abcdef1` для выката конкретной версии/rollback.

### 4.3 Деплой с локальной машины через `scripts/deploy.sh`

```bash
chmod +x scripts/deploy.sh
VPS_HOST=1.2.3.4 \
  VPS_USER=root \
  IMAGE_TAG=latest \
  GHCR_USER=ваш_github_username \
  GHCR_TOKEN=ваш_pat_read_packages \
  APP_DIR=/opt/pdftour-creator-2 \
  ./scripts/deploy.sh
```

Скрипт делает только нужный минимум: проверяет SSH, при необходимости логинится в GHCR, выполняет `IMAGE_TAG=<tag> docker compose pull && docker compose up -d` и ждёт healthcheck `HTTP 405`.  
Если в `APP_DIR` нет `docker-compose.yml`, загрузите его заранее (или включите `GIT_SYNC_ENABLED=true` и задайте `REPO_URL`).

### 4.4 Ручной деплой на VPS

```bash
cd /opt/pdftour-creator-2
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
IMAGE_TAG=latest docker compose pull
IMAGE_TAG=latest docker compose up -d
docker compose ps
```

### 4.5 Rollback на предыдущий SHA-тег

```bash
cd /opt/pdftour-creator-2
IMAGE_TAG=sha-abcdef1 docker compose pull
IMAGE_TAG=sha-abcdef1 docker compose up -d
```

Проверка rollback:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/api/pdf
# Ожидается 405
```

---

## 5. GitHub Secrets и доступы

### 5.1 Secrets для workflow `docker-publish.yml`

- Дополнительные секреты не требуются: публикация идет через встроенный `GITHUB_TOKEN`.
- В workflow уже должны быть права: `permissions: packages: write`.

### 5.2 Secrets для workflow `deploy-vps.yml`

Обязательные:

| Secret            | Назначение |
|-------------------|------------|
| `VPS_HOST`        | Хост VPS |
| `VPS_USER`        | SSH-пользователь |
| `SSH_PRIVATE_KEY` | Приватный SSH-ключ для подключения из Actions |
| `GHCR_USER`       | Логин для `docker login ghcr.io` |
| `GHCR_TOKEN`      | Токен с `read:packages` для pull приватного image |

Опциональные:

| Secret     | По умолчанию | Назначение |
|------------|--------------|------------|
| `VPS_PORT` | `22`         | SSH порт |
| `APP_DIR`  | `/opt/pdftour-creator-2` | Директория приложения |

### 5.3 Рекомендации по GHCR токену

- Для pull с VPS используйте отдельный PAT/organization token c минимальными правами (`read:packages`).
- Не храните токен в репозитории; только в GitHub Secrets или переменных окружения VPS.
- После ротации токена обновите `GHCR_TOKEN` в Secrets.

---

## 6. Настройка Nginx

Nginx выступает обратным прокси и (опционально) раздаёт SSL через Let's Encrypt.

### 5.1 Установка Nginx (если ещё не установлен)

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 5.2 Конфигурация сайта

В репозитории есть пример конфига: `infra/nginx/pdf-service.conf`.

Скопируйте его на VPS и замените домен на свой (в плане упоминался сабдомен вида `quotes.ваш-домен.com`):

```bash
sudo cp /opt/pdftour-creator-2/infra/nginx/pdf-service.conf /etc/nginx/sites-available/pdf-service.conf
sudo nano /etc/nginx/sites-available/pdf-service.conf
```

Замените:

- `quotes.jinn-travel.com` → ваш домен (например `quotes.google.com`);
- при использовании Let's Encrypt — пути к сертификатам в `ssl_certificate` и `ssl_certificate_key`;
- при необходимости — имена лог-файлов.

В конфиге upstream смотрит на `127.0.0.1:3004` — это порт, на котором приложение доступно на хосте из `docker-compose.yml`.

Включите сайт и проверьте конфигурацию:

```bash
sudo ln -sf /etc/nginx/sites-available/pdf-service.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 SSL (Let's Encrypt)

Установка Certbot (Ubuntu/Debian):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

Перед выдачей сертификата Nginx должен отвечать по HTTP на ваш домен (в конфиге уже есть `location /.well-known/acme-challenge/`). Получение сертификата:

```bash
sudo certbot --nginx -d quotes.ваш-домен.com
```

Certbot сам поправит конфиг Nginx для SSL. Обновление сертификатов:

```bash
sudo certbot renew --dry-run
```

Рекомендуется оставить задание в cron для `certbot renew`.

---

## 7. Настройка DNS для сабдомена

У доменного регистратора или в панели Hostinger создайте A-запись для сабдомена:

- **Имя:** `quotes` (или полное имя, например `quotes.affiliate-platform.com`, в зависимости от панели)
- **Тип:** A
- **Значение:** IP вашего VPS
- **TTL:** 300–3600

После сохранения подождите распространения DNS (от нескольких минут до часов). Проверка:

```bash
dig quotes.ваш-домен.com +short
# или
nslookup quotes.ваш-домен.com
```

---

## 8. Мониторинг и логи

### 7.1 Логи приложения (Docker)

```bash
cd /opt/pdftour-creator-2
docker compose logs -f trip-quote-builder
```

Ограничение по количеству строк:

```bash
docker compose logs --tail=200 trip-quote-builder
```

### 7.2 Логи Nginx

В конфиге указаны, например:

- доступ: `/var/log/nginx/quotes.jinn-travel.access.log`
- ошибки: `/var/log/nginx/quotes.jinn-travel.error.log`

Просмотр в реальном времени:

```bash
sudo tail -f /var/log/nginx/quotes.jinn-travel.access.log
sudo tail -f /var/log/nginx/quotes.jinn-travel.error.log
```

### 7.3 Состояние контейнеров и здоровья

```bash
docker compose ps
docker inspect trip-quote-builder --format='{{.State.Health.Status}}'
```

### 7.4 Данные приложения

- Конфиг цен сохраняется в `data/pricingConfig.json` на хосте (volume `./data:/app/data`).
- Регулярно делайте бэкап директории `data` (и при необходимости логов).

---

## 9. Краткий чеклист деплоя

1. [ ] VPS с Ubuntu/Debian, доступ по SSH
2. [ ] Выполнен `scripts/setup-vps.sh` на VPS
3. [ ] Подготовлен `docker-compose.yml` в `APP_DIR` на VPS (или включен `GIT_SYNC_ENABLED=true` и задан `REPO_URL`)
4. [ ] Настроены GitHub Secrets: `VPS_HOST`, `VPS_USER`, `SSH_PRIVATE_KEY`, `GHCR_USER`, `GHCR_TOKEN` (и опц. `VPS_PORT`, `APP_DIR`)
5. [ ] Выполнен build+push image в GHCR (`docker-publish.yml`)
6. [ ] Выполнен deploy нужного `IMAGE_TAG` (`deploy-vps.yml` или `scripts/deploy.sh`)
7. [ ] Проверен ответ приложения: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/api/pdf` (ожидается `405`)
8. [ ] Проверен сценарий rollback на `sha-<short_sha>`
9. [ ] Установлен и настроен Nginx, скопирован и отредактирован `infra/nginx/pdf-service.conf`
10. [ ] Настроен DNS (A-запись на IP VPS)
11. [ ] Установлен SSL (certbot) и проверен доступ по HTTPS
12. [ ] Проверены логи и состояние контейнера

После выполнения пунктов приложение будет доступно по выбранному домену через Nginx с сохранением конфига цен в `data/pricingConfig.json`.
