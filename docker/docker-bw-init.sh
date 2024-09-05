#!/usr/bin/env bash

set -e

##--> NSS_WRAPPER hook
# Dockerfile original values
dockerfileUser="borgwarehouse"
# mapping uid/gid process owner to borgwarehouse user with nss_wrapper
user_id=$(id -u)
group_id=$(id -g)
# original database
origpasswd="/etc/passwd"
origgroup="/etc/group"
# As this container is runable in read-only mode, the new passwd/group files must be written
# within a mounted volume, in this specific case, use /home/borgwarehouse/tmp which is also needed by supervisord
newpasswd="/home/borgwarehouse/tmp/passwd"
newgroup="/home/borgwarehouse/tmp/group"
# map passwd with $dockerfileUser
export user_id group_id # needed for awk commands
line=$(grep $dockerfileUser ${origpasswd} | awk -F ":" '{print $1":"$2":"ENVIRON["user_id"]":"ENVIRON["group_id"]":"$5":"$6":"$7}')
cat ${origpasswd} | sed -E "s|^$dockerfileUser.*$|$line|" >${newpasswd}
# map group with $dockerfileUser
line=$(grep $dockerfileUser ${origgroup} | awk -F ":" '{print $1":x:"ENVIRON["group_id"]":"}')
cat ${origgroup} | sed -E "s|^$dockerfileUser.*$|$line|" >${newgroup}
# set nss_wrapper environment
source "/etc/profile.d/nss_wrapper_profile.sh"
##<--

SSH_DIR="/home/borgwarehouse/.ssh"
AUTHORIZED_KEYS_FILE="$SSH_DIR/authorized_keys"
REPOS_DIR="/home/borgwarehouse/repos"

print_green() {
  echo -e "\e[92m$1\e[0m"
}
print_red() {
  echo -e "\e[91m$1\e[0m"
}

init_ssh_server() {
  if [ -z "$(ls -A /etc/ssh)" ]; then
    print_green "/etc/ssh is empty, generating SSH host keys..."
    ssh-keygen -A
    cp /home/borgwarehouse/moduli /etc/ssh/
  fi
  if [ ! -f "/etc/ssh/sshd_config" ]; then
    print_green "sshd_config not found in your volume, copying the default one..."
    cp /home/borgwarehouse/app/sshd_config /etc/ssh/
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
  RSA_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_rsa_key | awk '{print $2}')
  ED25519_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key | awk '{print $2}')
  ECDSA_FINGERPRINT=$(ssh-keygen -lf /etc/ssh/ssh_host_ecdsa_key | awk '{print $2}')
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
init_ssh_server
check_ssh_directory
create_authorized_keys_file
check_repos_directory
get_SSH_fingerprints

print_green "Successful initialization. BorgWarehouse is ready !"
# Using the container as "Read Only", give TMP path to supervisord
# otherwise: supervisord error:
# FileNotFoundError: [Errno 2] No usable temporary directory found in ['/tmp', '/var/tmp', '/usr/tmp', '/home/borgwarehouse/app']
export TMP="/home/borgwarehouse/tmp"
exec supervisord -c /home/borgwarehouse/app/supervisord.conf
