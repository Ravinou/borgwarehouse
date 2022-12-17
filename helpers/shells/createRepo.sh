#!/bin/bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 3 arguments : [reponame] X [SSH pub key] X [quota]
# Main steps are :
# - check if args are present
# - check the ssh pub key format
# - check if borgbackup package is install
# - generate a random username, check if it exists in /etc/passwd
# - add the user (with random name), group, shell and home
# - create a pool which is the folder where all the repositories for a user are located (only one by user for borgwarehouse usage)
# - create the authorized_keys
# - add the SSH public key in the authorized_keys with borg restriction for repository and storage quota.
# This simple method prevents the user from connecting to the server with a shell in SSH.
# He can only use the borg command. Moreover, he will not be able to leave his repository or create a new one.
# It is similar to a jail and that is the goal.

# Exit when any command fails
set -e

# Check args
if [ "$1" == "" ] || [ "$2" == "" ] || [ "$3" == "" ];then
    echo "This shell takes 3 argument : Reponame, SSH Public Key, Quota in Go [e.g. : 10] "
    exit 1
fi

# Check if the SSH public key is a valid format
# This pattern validates SSH public keys for : rsa, ed25519, ed25519-sk
pattern='(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?'
if [[ ! "$2" =~ $pattern ]]
then
    echo "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)"
    exit 2
fi

# Check if borgbackup is installed
if ! [ -x "$(command -v borgbackup)" ]; then
  echo "You must install borgbackup package."
  exit 3
fi

# Generation of a random for username
randUsername () {
    openssl rand -hex 4
}
user=$(randUsername)

# Check if the random is already a username.
while grep -q $user /etc/passwd
do
    user=$(randUsername)
done

# Some variables
group="${user}"
home="/var/borgwarehouse/${user}"
pool="${home}/repos"

## add user and create homedirectory ${user} - [shell=/bin/bash home=${home} group=${group}]
sudo useradd -d ${home} -s "/bin/bash" -m ${user}

## Create directory ${home}/.ssh
sudo mkdir -p ${home}/.ssh

## Create autorized_keys file
sudo touch ${home}/.ssh/authorized_keys

## Create the repo
sudo mkdir -p "${pool}/$1"

## Check if authorized_keys exists
authorized_keys="${home}/.ssh/authorized_keys"
if [ ! -f "${authorized_keys}" ];then
    echo "${authorized_keys} must be present"
    exit 4
fi

## Change permissions
sudo chmod -R 750 ${home}
sudo chmod -R g+s ${home}
sudo chmod 600 ${authorized_keys}
sudo chown -R ${user}:borgwarehouse ${home}

## Add ssh public key in authorized_keys with borg restriction for only 1 repository (:$1) and storage quota
restricted_authkeys="command=\"cd ${pool};borg serve --restrict-to-repository ${pool}/$1 --storage-quota $3G\",restrict $2"
echo "$restricted_authkeys" | sudo tee ${authorized_keys} >/dev/null

## Return the unix user
echo ${user}
