#!/bin/bash
# Supported: Debian, Ubuntu, RHEL/CentOS/Fedora, Arch
# Requires: bash, curl, docker, openssl

set -e

GITHUB_REPO="Ravinou/borgwarehouse"
DEFAULT_DIR="borgwarehouse"

print_green()  { echo -e "\e[92m$1\e[0m"; }
print_yellow() { echo -e "\e[93m$1\e[0m"; }
print_red()    { echo -e "\e[91m$1\e[0m"; }
print_bold()   { echo -e "\e[1m$1\e[0m"; }

# Check dependencies
for cmd in curl docker openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    print_red "[ERROR] '$cmd' is required but not installed."
    exit 1
  fi
done

# Resolve latest release
LATEST=$(curl -fsSL "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
if [ -z "$LATEST" ]; then
  print_red "[ERROR] Could not fetch the latest release from GitHub."
  exit 1
fi

REPO_RAW="https://raw.githubusercontent.com/$GITHUB_REPO/$LATEST"

echo ""
print_bold "=============================="
print_bold " BorgWarehouse installer $LATEST"
print_bold "=============================="
echo ""

# Resolve the user that will own BorgWarehouse data
if [ "$(id -u)" -eq 0 ]; then
  print_yellow "You are running this script as root. BorgWarehouse must not run as root."
  echo ""
  read -rp "Username that will run BorgWarehouse: " BW_USER </dev/tty

  if ! id "$BW_USER" &>/dev/null; then
    print_red "[ERROR] User '$BW_USER' does not exist."
    exit 1
  fi

  PUID=$(id -u "$BW_USER")
  PGID=$(id -g "$BW_USER")
  SUGGESTED_DIR="/home/$BW_USER/$DEFAULT_DIR"
else
  PUID=$(id -u)
  PGID=$(id -g)
  SUGGESTED_DIR="$(pwd)/$DEFAULT_DIR"
fi

# Install directory
echo ""
read -rp "Install directory [$SUGGESTED_DIR]: " INSTALL_PATH </dev/tty
INSTALL_PATH="${INSTALL_PATH:-$SUGGESTED_DIR}"
INSTALL_PATH="${INSTALL_PATH/#\~/$HOME}"

# Required configuration
echo ""
print_bold "-- Configuration --"
echo ""

read -rp "Your domain or IP (FQDN, e.g. borgwarehouse.example.com): " FQDN </dev/tty
while [ -z "$FQDN" ]; do
  print_red "FQDN is required."
  read -rp "Your domain or IP (FQDN): " FQDN </dev/tty
done

read -rp "Full URL of your BorgWarehouse instance (e.g. https://borgwarehouse.example.com): " NEXTAUTH_URL </dev/tty
while [ -z "$NEXTAUTH_URL" ]; do
  print_red "NEXTAUTH_URL is required."
  read -rp "Full URL: " NEXTAUTH_URL </dev/tty
done

read -rp "Web port to expose [3000]: " WEB_SERVER_PORT </dev/tty
WEB_SERVER_PORT="${WEB_SERVER_PORT:-3000}"

read -rp "SSH port to expose [2222]: " SSH_SERVER_PORT </dev/tty
SSH_SERVER_PORT="${SSH_SERVER_PORT:-2222}"

# Auto-generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRONJOB_KEY=$(openssl rand -base64 32)

# Install
echo ""
print_green "Installing into $INSTALL_PATH (UID=$PUID GID=$PGID)..."

if [ -d "$INSTALL_PATH" ]; then
  print_red "[ERROR] Directory '$INSTALL_PATH' already exists. Remove it first or choose another location."
  exit 1
fi

mkdir -p "$INSTALL_PATH"
cd "$INSTALL_PATH"

curl -fsSL "$REPO_RAW/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$REPO_RAW/.env.sample" -o .env

mkdir config ssh ssh_host repos
chown -R "$PUID:$PGID" config ssh ssh_host repos .env docker-compose.yml

# Fill .env
sed -i "s|^PUID=.*|PUID=$PUID|" .env
sed -i "s|^PGID=.*|PGID=$PGID|" .env
sed -i "s|^FQDN=.*|FQDN=$FQDN|" .env
sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$NEXTAUTH_URL|" .env
sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|" .env
sed -i "s|^CRONJOB_KEY=.*|CRONJOB_KEY=$CRONJOB_KEY|" .env
sed -i "s|^WEB_SERVER_PORT=.*|WEB_SERVER_PORT=$WEB_SERVER_PORT|" .env
sed -i "s|^SSH_SERVER_PORT=.*|SSH_SERVER_PORT=$SSH_SERVER_PORT|" .env

echo ""
print_green "BorgWarehouse $LATEST is ready in '$INSTALL_PATH'."
echo ""
print_yellow "Secrets have been auto-generated and saved in .env."
print_yellow "You can review the full configuration: $INSTALL_PATH/.env"
echo ""
print_green "Start with: cd $INSTALL_PATH && docker compose up -d"
