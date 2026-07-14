#!/bin/bash

set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

SSH_DIR="/home/borgwarehouse/.ssh"
AUTHORIZED_KEYS_FILE="$SSH_DIR/authorized_keys"
REPOS_DIR="/home/borgwarehouse/repos"
CONFIG_DIR="/home/borgwarehouse/app/config"

print_green() { echo -e "\e[92m$1\e[0m"; }
print_red()   { echo -e "\e[91m$1\e[0m"; }

# 1. Remap borgwarehouse to PUID:PGID

remap_user() {
  if [ "$PUID" -eq 0 ] || [ "$PGID" -eq 0 ]; then
    print_red "[ERROR] PUID and PGID cannot be 0. Running the app as root is not allowed."
    exit 1
  fi

  print_green "Mapping borgwarehouse to UID=$PUID GID=$PGID"
  # Edit passwd/group directly to avoid usermod scanning and chowning mounted volumes
  sed -i "s/^borgwarehouse:x:[0-9]*:[0-9]*:/borgwarehouse:x:$PUID:$PGID:/" /etc/passwd
  sed -i "s/^borgwarehouse:x:[0-9]*:/borgwarehouse:x:$PGID:/" /etc/group

  # App files stay root:root (set in Dockerfile) so the running app cannot
  # modify its own code. Only chown the home dir itself; volume mounts
  # (.ssh, repos, app/config) are handled separately by prepare_volume.
  chown borgwarehouse:borgwarehouse /home/borgwarehouse
}

# 2. Check volume is mounted, fix ownership and check it is writable

# Detect a real mount (named volume or bind mount) via /proc/mounts. #615
is_mounted() {
  grep -q " $1 " /proc/mounts
}

prepare_volume() {
  local dir=$1
  local name=$2
  local mode=$3

  if ! is_mounted "$dir"; then
    print_red "[ERROR] Volume '$name' is not mounted. Expected path: $dir"
    print_red "        Check the volumes section in your docker-compose.yml."
    exit 1
  fi

  # We run as root here: align the volume ownership to PUID:PGID so that named
  # volumes (created root:root or as the build-time user) become writable by the
  # app, whatever PUID/PGID is used.
  if [ "$mode" = "recursive" ]; then
    chown -R "$PUID:$PGID" "$dir" 2>/dev/null || true
  else
    # Top-level only: avoids walking a potentially huge repos tree. Existing
    # repository sub-directories were already created by the app user.
    chown "$PUID:$PGID" "$dir" 2>/dev/null || true
  fi

  if ! gosu borgwarehouse test -w "$dir" 2>/dev/null; then
    print_red "[ERROR] Volume '$name' ($dir) is not writable by UID=$PUID GID=$PGID."
    print_red "        If it is a bind mount, fix on the host: chown -R $PUID:$PGID <your-host-path-for-$name>"
    exit 1
  fi
}

# 3. Generate SSH host keys if needed

init_ssh_server() {
  # Generate any MISSING host key type. `ssh-keygen -A` never overwrites existing
  # keys, so custom / pre-provisioned keys are preserved; it only fills in the
  # key types BorgWarehouse needs (rsa, ecdsa, ed25519), which get_SSH_fingerprints
  # reads later. We check all three files (not just one, and not "/etc/ssh empty")
  # so a volume providing only a subset of key types is completed correctly. #615
  if [ ! -f /etc/ssh/ssh_host_ed25519_key ] \
     || [ ! -f /etc/ssh/ssh_host_rsa_key ] \
     || [ ! -f /etc/ssh/ssh_host_ecdsa_key ]; then
    print_green "Generating missing SSH host keys..."
    ssh-keygen -A
  fi
  if [ ! -f /etc/ssh/moduli ]; then
    cp /home/borgwarehouse/moduli /etc/ssh/
  fi
  if [ ! -f "/etc/ssh/sshd_config" ]; then
    print_green "sshd_config not found in your volume, copying the default one..."
    cp /home/borgwarehouse/app/sshd_config /etc/ssh/
  fi
}

# 4. Setup authorized_keys

setup_authorized_keys() {
  if [ ! -f "$AUTHORIZED_KEYS_FILE" ]; then
    print_green "Creating authorized_keys file..."
    touch "$AUTHORIZED_KEYS_FILE"
  fi
  chown borgwarehouse:borgwarehouse "$SSH_DIR" "$AUTHORIZED_KEYS_FILE"
  chmod 700 "$SSH_DIR"
  chmod 600 "$AUTHORIZED_KEYS_FILE"
}

# 5. Read SSH fingerprints

get_SSH_fingerprints() {
  print_green "Getting SSH fingerprints..."
  RSA_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_rsa_key | awk '{print $2}')
  ED25519_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key | awk '{print $2}')
  ECDSA_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_ecdsa_key | awk '{print $2}')
  export SSH_SERVER_FINGERPRINT_RSA="$RSA_FINGERPRINT"
  export SSH_SERVER_FINGERPRINT_ED25519="$ED25519_FINGERPRINT"
  export SSH_SERVER_FINGERPRINT_ECDSA="$ECDSA_FINGERPRINT"
}

# 6. Check secrets

check_env() {
  if [ -z "$CRONJOB_KEY" ]; then
    CRONJOB_KEY=$(openssl rand -base64 32)
    print_green "CRONJOB_KEY not found or empty. Generating a random key..."
    export CRONJOB_KEY
  fi

  if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    print_green "NEXTAUTH_SECRET not found or empty. Generating a random key..."
    export NEXTAUTH_SECRET
  fi
}

# Run

remap_user
check_env
mkdir -p /run/sshd
init_ssh_server
prepare_volume "$SSH_DIR"    ".ssh"   recursive
prepare_volume "$REPOS_DIR"  "repos"
prepare_volume "$CONFIG_DIR" "config" recursive
setup_authorized_keys
get_SSH_fingerprints

print_green "Successful initialization. BorgWarehouse is ready !"
exec supervisord -c /home/borgwarehouse/app/supervisord.conf 