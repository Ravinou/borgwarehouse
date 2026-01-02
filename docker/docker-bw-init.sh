#!/bin/bash

set -e

SSH_DIR="/home/borgwarehouse/.ssh"
AUTHORIZED_KEYS_FILE="$SSH_DIR/authorized_keys"
REPOS_DIR="/home/borgwarehouse/repos"

print_green() {
  echo -e "\e[92m$1\e[0m";
}
print_red() { 
  echo -e "\e[91m$1\e[0m";
}

init_ssh_server() {
  if [ -z "$(ls -A $SSH_DIR)" ]; then
    print_green "$SSH_DIR is empty, generating SSH host keys..."
    dropbearkey -t rsa -f $SSH_DIR/ssh_host_rsa_key
    dropbearkey -t ed25519 -f $SSH_DIR/ssh_host_ed25519_key
    dropbearkey -t ecdsa -f  $SSH_DIR/ssh_host_ecdsa_key
  fi
}

check_ssh_directory() {
  if [ ! -d "$SSH_DIR" ]; then
    print_red "The .ssh directory does not exist, you need to mount it as docker volume."
    exit 1
  else 
    chmod 700 "$SSH_DIR"
  fi
}

create_authorized_keys_file() {
  if [ ! -f "$AUTHORIZED_KEYS_FILE" ]; then
    print_green "The authorized_keys file does not exist, creating..."
    touch "$AUTHORIZED_KEYS_FILE"
  fi
    chmod 600 "$AUTHORIZED_KEYS_FILE"
}

check_repos_directory() {
  if [ ! -d "$REPOS_DIR" ]; then
    print_red "The repos directory does not exist, you need to mount it as docker volume."
    exit 2
  else 
    chmod 700 "$REPOS_DIR"
  fi
}

get_SSH_fingerprints() {
  print_green "Getting SSH fingerprints..."
  RSA_FINGERPRINT=$(dropbearkey -y -f $SSH_DIR/ssh_host_rsa_key | awk 'END{print $2}')
  ED25519_FINGERPRINT=$(dropbearkey -y -f $SSH_DIR/ssh_host_ed25519_key | awk 'END{print $2}')
  ECDSA_FINGERPRINT=$(dropbearkey -y -f $SSH_DIR/ssh_host_ecdsa_key | awk 'END{print $2}')
  export SSH_SERVER_FINGERPRINT_RSA="$RSA_FINGERPRINT"
  export SSH_SERVER_FINGERPRINT_ED25519="$ED25519_FINGERPRINT"
  export SSH_SERVER_FINGERPRINT_ECDSA="$ECDSA_FINGERPRINT"
}

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

check_env
check_ssh_directory
create_authorized_keys_file
check_repos_directory
get_SSH_fingerprints

print_green "Successful initialization. BorgWarehouse is ready !"
exec supervisord -c /home/borgwarehouse/app/supervisord.conf 