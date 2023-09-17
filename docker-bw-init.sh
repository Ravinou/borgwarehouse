#!/bin/bash

set -e

SSH_DIR="/home/borgwarehouse/.ssh"
AUTHORIZED_KEYS_FILE="$SSH_DIR/authorized_keys"
REPOS_DIR="/home/borgwarehouse/repos"

init_ssh_server() {
  if [ -z "$(ls -A /etc/ssh)" ]; then
    echo "/etc/ssh is empty, generating SSH host keys..."
    ssh-keygen -A
    cp /home/borgwarehouse/sshd_config /home/borgwarehouse/moduli /etc/ssh/
  fi
}

check_ssh_directory() {
  if [ ! -d "$SSH_DIR" ]; then
    echo "The .ssh directory does not exist, you need to mount it as docker volume."
    exit 1
  else 
    chmod 700 "$SSH_DIR"
  fi
}

create_authorized_keys_file() {
  if [ ! -f "$AUTHORIZED_KEYS_FILE" ]; then
    echo "The authorized_keys file does not exist, creating..."
    touch "$AUTHORIZED_KEYS_FILE"
  fi
    chmod 600 "$AUTHORIZED_KEYS_FILE"
}

check_repos_directory() {
  if [ ! -d "$REPOS_DIR" ]; then
    echo "The repos directory does not exist, you need to mount it as docker volume."
    exit 2
  else 
    chmod 700 "$REPOS_DIR"
  fi
}

init_ssh_server
check_ssh_directory
create_authorized_keys_file
check_repos_directory

sudo service ssh restart

exec "$@"