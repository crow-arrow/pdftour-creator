#!/usr/bin/env bash

###############################################################################
# Первоначальная настройка VPS для PDFtour-creator-2
#
# Что делает скрипт:
# - Устанавливает Docker и Docker Compose (плагин)
# - Создает директории для приложения, данных и логов
# - Настраивает права доступа
# - (Опционально) подготавливает директорию для конфигов Nginx
#
# Предполагается, что скрипт выполняется НА VPS с правами sudo.
#
# Пример запуска:
#   chmod +x scripts/setup-vps.sh
#   sudo ./scripts/setup-vps.sh
#
# Можно переопределить переменные окружения перед запуском:
#   APP_DIR=/opt/pdf-service DATA_DIR=/opt/pdf-service/data LOG_DIR=/var/log/pdf-service sudo ./scripts/setup-vps.sh
###############################################################################

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/pdftour-creator-2}"
DATA_DIR="${DATA_DIR:-$APP_DIR/data}"
LOG_DIR="${LOG_DIR:-$APP_DIR/logs}"
NGINX_CONF_DIR="${NGINX_CONF_DIR:-/etc/nginx/sites-available}"
NGINX_CONF_LINK_DIR="${NGINX_CONF_LINK_DIR:-/etc/nginx/sites-enabled}"

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

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    error "Скрипт должен выполняться с правами root (sudo)."
  fi
}

detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID:-unknown}"
  else
    echo "unknown"
  fi
}

install_docker_ubuntu() {
  info "Установка Docker и Docker Compose (Ubuntu/Debian)..."

  apt-get update -y
  apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable docker
  systemctl restart docker
}

install_docker_if_needed() {
  if command -v docker >/dev/null 2>&1; then
    info "Docker уже установлен."
  else
    local os_id
    os_id="$(detect_os)"
    case "$os_id" in
      ubuntu|debian)
        install_docker_ubuntu
        ;;
      *)
        warn "Автоматическая установка Docker не поддерживается для ОС: $os_id"
        warn "Установите Docker и Docker Compose вручную, затем перезапустите скрипт."
        ;;
    esac
  fi

  if docker compose version >/dev/null 2>&1; then
    info "Docker Compose plugin уже установлен."
  else
    warn "Docker Compose plugin не найден. Убедитесь, что установлен пакет docker-compose-plugin."
  fi
}

create_directories() {
  info "Создание директорий приложения и данных..."

  mkdir -p "$APP_DIR"
  mkdir -p "$DATA_DIR"
  mkdir -p "$LOG_DIR"

  info "Настройка прав доступа для директорий..."
  chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" "$APP_DIR"
  chmod -R 755 "$APP_DIR"

  info "Директории:"
  echo "  APP_DIR:  $APP_DIR"
  echo "  DATA_DIR: $DATA_DIR"
  echo "  LOG_DIR:  $LOG_DIR"
}

prepare_nginx() {
  # Этот шаг опционален и зависит от того, как вы будете настраивать Nginx.
  # Здесь мы лишь помогаем подготовить директории.

  if ! command -v nginx >/dev/null 2>&1; then
    warn "Nginx не установлен. Пропускаем подготовку конфигурации Nginx."
    return 0
  fi

  info "Проверка директорий конфигурации Nginx..."
  if [[ -d "$NGINX_CONF_DIR" && -d "$NGINX_CONF_LINK_DIR" ]]; then
    info "Директории конфигурации Nginx найдены:"
    echo "  NGINX_CONF_DIR:       $NGINX_CONF_DIR"
    echo "  NGINX_CONF_LINK_DIR:  $NGINX_CONF_LINK_DIR"
    info "Позже вы сможете скопировать конфиг, например infra/nginx/pdf-service.conf, в $NGINX_CONF_DIR и создать symlink в $NGINX_CONF_LINK_DIR."
  else
    warn "Не удалось найти стандартные директории конфигурации Nginx. Проверьте пути вручную."
  fi
}

main() {
  require_root

  info "=== Настройка VPS для PDFtour-creator-2 ==="
  info "OS ID: $(detect_os)"

  install_docker_if_needed
  create_directories
  prepare_nginx

  info "Первоначальная настройка VPS завершена."
  info "Далее:"
  echo "  1) Склонируйте репозиторий в $APP_DIR (или другую директорию)."
  echo "  2) Настройте .env и docker-compose.yml при необходимости."
  echo "  3) Используйте scripts/deploy.sh для деплоя новых версий."
}

main "$@"

