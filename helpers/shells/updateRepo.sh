#!/bin/bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 2 args : [user] [new SSH pub key] [quota]
# This shell updates the ssh key for a repository.

# Exit when any command fails
set -e

# Check args
if [ "$1" == "" ] || [ "$2" == "" ] || [ "$3" == "" ];then
    echo "This shell takes 3 args : [user] [new SSH pub key] [quota]"
    exit 1
fi

# Some variables
home="/var/borgwarehouse/$1"

# Check if the SSH public key is a valid format
# This pattern validates SSH public keys for : rsa, ed25519, ed25519-sk
pattern='(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?'
if [[ ! "$2" =~ $pattern ]]
then
    echo "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)"
    exit 2
fi

# Check if username length is 8 char. With createRepo.sh our randoms have a length of 8 characters. 
# If we receive another length there is necessarily a problem.
username=$1
if [ ${#username} != 8 ]
then
    echo "Error with the length of the username."
    exit 3
fi

# Check if the user exists
if ! id "$1" &>/dev/null; then
    echo "The user $1 does not exist"
    exit 4
fi

# Modify authorized_keys for the user : only the ssh key is modify with this regex
sudo sed -ri "s|(command=\".*\",restrict ).*|\1$2|g" "$home/.ssh/authorized_keys"

# Modify authorized_keys for the user : only the quota is modify with this regex
sudo sed -ri "s|--storage-quota.*\"|--storage-quota $3G\"|g" "$home/.ssh/authorized_keys"
