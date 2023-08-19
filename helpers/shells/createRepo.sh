#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 2 arguments : [SSH pub key] X [quota]
# Main steps are :
# - check if args are present
# - check the ssh pub key format
# - check if borgbackup package is install
# - generate a random repositoryName
# - add the SSH public key in the authorized_keys with borg restriction for repository and storage quota.
# This simple method prevents the user from connecting to the server with a shell in SSH.
# He can only use the borg command. Moreover, he will not be able to leave his repository or create a new one.
# It is similar to a jail and that is the goal.

# WAITING resolve of this for quota... : https://github.com/borgbackup/borg/issues/7757

# Exit when any command fails
set -e

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

# Some variables
pool="${home}/repos"
authorized_keys="${home}/.ssh/authorized_keys"

# Check args
if [ "$1" == "" ] || [ "$2" == "" ];then
    echo "This shell takes 2 arguments : SSH Public Key, Quota in Go [e.g. : 10] "
    exit 1
fi

# Check if the SSH public key is a valid format
# This pattern validates SSH public keys for : rsa, ed25519, ed25519-sk
pattern='(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?'
if [[ ! "$1" =~ $pattern ]]
then
    echo "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)"
    exit 2
fi

# Check if borgbackup is installed
if ! [ -x "$(command -v borg)" ]; then
  echo "You must install borgbackup package."
  exit 3
fi

# Generation of a random for repositoryName
randRepositoryName () {
    openssl rand -hex 4
}
repositoryName=$(randRepositoryName)

## Check if authorized_keys exists
if [ ! -f "${authorized_keys}" ];then
    echo "${authorized_keys} must be present"
    exit 4
fi

## Add ssh public key in authorized_keys with borg restriction for only 1 repository (:$1) and storage quota
restricted_authkeys="command=\"cd ${pool};borg serve --restrict-to-path ${pool}/${repositoryName} --storage-quota $2G\",restrict $1"
echo "$restricted_authkeys" | tee -a "${authorized_keys}" >/dev/null

## Return the unix user
echo "${repositoryName}"