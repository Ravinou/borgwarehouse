#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 2 arguments : [SSH pub key] X [quota] x [append only mode (boolean)]
# Main steps are :
# - check if args are present
# - check the ssh pub key format
# - check if the ssh pub key is already present in authorized_keys
# - check if borgbackup package is install
# - generate a random repositoryName
# - add the SSH public key in the authorized_keys with borg restriction for repository and storage quota.
# This simple method prevents the user from connecting to the server with a shell in SSH.
# He can only use the borg command. Moreover, he will not be able to leave his repository or create a new one.
# It is similar to a jail and that is the goal.

# Limitation : all SSH pubkey are unique : https://github.com/borgbackup/borg/issues/7757

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
if [ "$1" == "" ] || [ "$2" == "" ] || ! [[ "$2" =~ ^[0-9]+$ ]] || [ "$3" != "true" ] && [ "$3" != "false" ]; then
    echo -n "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]"
    exit 1
fi

# Check if the SSH public key is a valid format
# This pattern validates SSH public keys for : rsa, ed25519, ed25519-sk
pattern='(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?'
if [[ ! "$1" =~ $pattern ]]
then
    echo -n "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)"
    exit 2
fi

## Check if authorized_keys exists
if [ ! -f "${authorized_keys}" ];then
    echo -n "${authorized_keys} must be present"
    exit 5
fi

# Check if SSH pub key is already present in authorized_keys
if grep -q "$1" "$authorized_keys"; then
    echo -n "SSH pub key already present in authorized_keys"
    exit 3
fi

# Check if borgbackup is installed
if ! [ -x "$(command -v borg)" ]; then
  echo -n "You must install borgbackup package."
  exit 4
fi

# Generation of a random for repositoryName
randRepositoryName () {
    openssl rand -hex 4
}
repositoryName=$(randRepositoryName)

# Append only mode
if [ "$3" == "true" ]; then
    appendOnlyMode=" --append-only"
else
    appendOnlyMode=""
fi

## Add ssh public key in authorized_keys with borg restriction for only 1 repository and storage quota
restricted_authkeys="command=\"cd ${pool};borg serve${appendOnlyMode} --restrict-to-path ${pool}/${repositoryName} --storage-quota $2G\",restrict $1"
echo "$restricted_authkeys" | tee -a "${authorized_keys}" >/dev/null

## Return the repositoryName
echo "${repositoryName}"