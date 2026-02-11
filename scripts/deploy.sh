#!/usr/bin/env bash

###############################################################################
# Скрипт деплоя PDFtour-creator-2 на VPS через SSH
#
# Что делает:
# - Подключается к VPS по SSH
# - Использует готовый docker-compose.yml на VPS (без build)
# - Логинится в GHCR (если переданы GHCR_USER/GHCR_TOKEN)
# - Выполняет docker compose pull && docker compose up -d с IMAGE_TAG
# - Выполняет healthcheck после обновления
#
# По умолчанию git-операции отключены. При необходимости их можно включить
# через GIT_SYNC_ENABLED=true и передать REPO_URL.
#
# Предполагается, что:
# - На VPS уже выполнен scripts/setup-vps.sh
# - На VPS установлен Docker + docker compose plugin
# - Есть доступ по SSH с ключом без пароля (или настроен ssh-agent)
#
# Пример запуска:
#   chmod +x scripts/deploy.sh
#   VPS_HOST=1.2.3.4 VPS_USER=root IMAGE_TAG=latest ./scripts/deploy.sh
#
# Можно создать .env.deploy и экспортировать переменные оттуда.
###############################################################################

set -euo pipefail

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REPO_URL="${REPO_URL:-}"
APP_DIR="${APP_DIR:-/opt/pdftour-creator-2}"
BRANCH="${BRANCH:-main}"
GIT_SYNC_ENABLED="${GIT_SYNC_ENABLED:-false}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-}"
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://localhost:3004/api/pdf}"
HEALTHCHECK_EXPECTED_STATUS="${HEALTHCHECK_EXPECTED_STATUS:-405}"
HEALTHCHECK_TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT_SECONDS:-120}"
HEALTHCHECK_INTERVAL_SECONDS="${HEALTHCHECK_INTERVAL_SECONDS:-5}"

SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

info() {
  echo -e "[INFO] $*"
}

warn() {
  echo -e "[WARN] $*" >&2
}

error() {
  echo -e "[ERROR] $*" >&2
  exit 1
}

usage() {
  cat <<EOF
Использование: VPS_HOST=... [опции] ./scripts/deploy.sh

Обязательные переменные окружения:
  VPS_HOST        IP или домен VPS

Необязательные:
  VPS_USER        Пользователь SSH (по умолчанию: root)
  VPS_PORT        Порт SSH (по умолчанию: 22)
  APP_DIR         Путь до директории приложения на VPS (по умолчанию: /opt/pdftour-creator-2)
  GIT_SYNC_ENABLED Включить git sync при отсутствии docker-compose.yml (по умолчанию: false)
  REPO_URL        URL репозитория для git sync (используется только при GIT_SYNC_ENABLED=true)
  BRANCH          Ветка для git sync (по умолчанию: main)
  IMAGE_TAG       Тег образа для деплоя (по умолчанию: latest)
  IMAGE_NAME      Имя образа (например ghcr.io/owner/repo), если нужно переопределить default из compose
  GHCR_USER       Логин для ghcr.io (обязательно вместе с GHCR_TOKEN для приватного пакета)
  GHCR_TOKEN      Token/PAT для ghcr.io (read:packages)

  HEALTHCHECK_URL             URL для проверки (по умолчанию: http://localhost:3004/api/pdf)
  HEALTHCHECK_EXPECTED_STATUS Ожидаемый HTTP статус (по умолчанию: 405)
  HEALTHCHECK_TIMEOUT_SECONDS Таймаут healthcheck в секундах (по умолчанию: 120)
  HEALTHCHECK_INTERVAL_SECONDS Интервал между проверками в секундах (по умолчанию: 5)

Пример:
  VPS_HOST=1.2.3.4 \\
  VPS_USER=root \\
  IMAGE_TAG=sha-abcdef1 \\
  GHCR_USER=github-user \\
  GHCR_TOKEN=ghp_xxx \\
  APP_DIR=/opt/pdftour-creator-2 \\
  ./scripts/deploy.sh
EOF
}

check_required_env() {
  if [[ -z "$VPS_HOST" ]]; then
    usage
    error "VPS_HOST обязателен для указания."
  fi

  if [[ -n "$GHCR_USER" && -z "$GHCR_TOKEN" ]]; then
    error "Если указан GHCR_USER, нужно указать и GHCR_TOKEN."
  fi

  if [[ -z "$GHCR_USER" && -n "$GHCR_TOKEN" ]]; then
    error "Если указан GHCR_TOKEN, нужно указать и GHCR_USER."
  fi
}

ssh_cmd() {
  ssh $SSH_OPTS -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" "$@"
}

prepare_app_dir() {
  info "Подготовка директории приложения на VPS..."
  ssh_cmd "set -euo pipefail; mkdir -p '$APP_DIR'; mkdir -p '$APP_DIR/data'"
}

sync_repo_if_needed() {
  if ssh_cmd "test -f '$APP_DIR/docker-compose.yml'"; then
    info "Найден docker-compose.yml в APP_DIR, пропускаем git sync."
    return 0
  fi

  if [[ "$GIT_SYNC_ENABLED" != "true" ]]; then
    error "В $APP_DIR не найден docker-compose.yml. Загрузите compose-файл на VPS или включите GIT_SYNC_ENABLED=true и передайте REPO_URL."
  fi

  if [[ -z "$REPO_URL" ]]; then
    error "Включен GIT_SYNC_ENABLED=true, но не передан REPO_URL для первичной инициализации."
  fi

  info "В APP_DIR нет compose-файла, выполняем clone/update репозитория..."
  ssh_cmd "
    set -euo pipefail
    if [ -d '$APP_DIR/.git' ]; then
      cd '$APP_DIR'
      git fetch --all
      git checkout '$BRANCH'
      git pull --ff-only origin '$BRANCH'
    else
      rm -rf '$APP_DIR'
      git clone '$REPO_URL' '$APP_DIR'
      cd '$APP_DIR'
      git checkout '$BRANCH' || true
    fi
  "
}

docker_login_if_needed() {
  if [[ -z "$GHCR_USER" && -z "$GHCR_TOKEN" ]]; then
    warn "GHCR_USER/GHCR_TOKEN не заданы: пропускаем docker login ghcr.io (подходит для публичного image)."
    return 0
  fi

  info "Логин в GHCR на VPS..."
  ssh_cmd "set -euo pipefail; echo '$GHCR_TOKEN' | docker login ghcr.io -u '$GHCR_USER' --password-stdin"
}

pull_and_up() {
  info "Обновление контейнеров через docker compose pull && up -d..."
  ssh_cmd "
    set -euo pipefail
    cd '$APP_DIR'
    if [ -n '$IMAGE_NAME' ]; then
      IMAGE_NAME='$IMAGE_NAME' IMAGE_TAG='$IMAGE_TAG' docker compose pull
      IMAGE_NAME='$IMAGE_NAME' IMAGE_TAG='$IMAGE_TAG' docker compose up -d
    else
      IMAGE_TAG='$IMAGE_TAG' docker compose pull
      IMAGE_TAG='$IMAGE_TAG' docker compose up -d
    fi
  "
}

healthcheck() {
  info "Ожидание старта сервиса (healthcheck)..."
  local elapsed=0

  while (( elapsed < HEALTHCHECK_TIMEOUT_SECONDS )); do
    local status_code
    status_code="$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' '$HEALTHCHECK_URL' || true")"

    if [[ "$status_code" == "$HEALTHCHECK_EXPECTED_STATUS" ]]; then
      info "Healthcheck успешен: $HEALTHCHECK_URL -> HTTP $status_code"
      return 0
    fi

    sleep "$HEALTHCHECK_INTERVAL_SECONDS"
    elapsed=$((elapsed + HEALTHCHECK_INTERVAL_SECONDS))
    info "Сервис ещё не готов (HTTP $status_code), ждём... (${elapsed}/${HEALTHCHECK_TIMEOUT_SECONDS} сек)"
  done

  warn "Healthcheck не прошёл за ${HEALTHCHECK_TIMEOUT_SECONDS} секунд (ожидали HTTP ${HEALTHCHECK_EXPECTED_STATUS})."
  ssh_cmd "cd '$APP_DIR' && docker compose ps" || true
  return 1
}

deploy() {
  info "Деплой на ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
  info "APP_DIR: $APP_DIR"
  info "GIT_SYNC_ENABLED: $GIT_SYNC_ENABLED"
  if [[ "$GIT_SYNC_ENABLED" == "true" ]]; then
    info "BRANCH: $BRANCH"
  fi
  info "IMAGE_TAG: $IMAGE_TAG"

  info "Проверка доступа по SSH..."
  ssh_cmd "echo 'SSH OK' >/dev/null"

  prepare_app_dir
  sync_repo_if_needed
  docker_login_if_needed
  pull_and_up
  healthcheck
}

main() {
  check_required_env
  deploy
  info "Деплой завершен."
}

main "$@"

