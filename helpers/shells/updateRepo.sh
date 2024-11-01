#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 4 args: [repositoryName] [new SSH pub key] [quota] [append-only mode (boolean)]
# This shell updates the SSH key and the quota for a repository.

# Exit when any command fails
set -e

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

# Check args
if [ "$1" == "" ] || [ "$2" == "" ] || [ "$3" == "" ] || [ "$4" != "true" ] && [ "$4" != "false" ]; then
    echo -n "This shell takes 4 args: [repositoryName] [new SSH pub key] [quota] [Append only mode [true|false]]"
    exit 1
fi

# Check if the SSH public key is a valid format
# This pattern validates SSH public keys for : rsa, ed25519, ed25519-sk
pattern='(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?'
if [[ ! "$2" =~ $pattern ]]
then
    echo -n "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)"
    exit 2
fi

# Check if the repositoryName pattern is an hexa 8 char. With createRepo.sh our randoms are hexa of 8 characters.
# If we receive another pattern there is necessarily a problem.
repositoryName=$1
if ! [[ "$repositoryName" =~ ^[a-f0-9]{8}$ ]]; then
    echo "Invalid repository name. Must be an 8-character hex string."
    exit 3
fi

# Check if a line in authorized_keys contains repository_name
if ! grep -q "command=\".*${repositoryName}.*\",restrict" "$home/.ssh/authorized_keys"; then
    echo -n "No line containing $repositoryName found in authorized_keys"
    exit 4
fi

# Check if the new SSH pub key is already present on a line OTHER than the one corresponding to repositoryName
found=false
regex="command=\".*${repositoryName}.*\",restrict"
while IFS= read -r line; do
    if [[ $line =~ $pattern ]]; then
        # Get the SSH pub key of the line (ignore the comment)
        key1=$(echo "${BASH_REMATCH[0]}" | awk '{print $1 " " $2}')
        # Get the SSH pub key of the new SSH pub key (ignore the comment)
        key2=$(echo "$2" | awk '{print $1 " " $2}')
        
        if [ "$key1" == "$key2" ]; then
            # If the SSH pub key is already present on a line other than the one corresponding to repositoryName
            if [[ ! $line =~ $regex ]]; then
                found=true
                break
            fi
        fi
    fi
done < "$home/.ssh/authorized_keys"
if [ "$found" = true ]; then
    echo -n "This SSH pub key is already present in authorized_keys on a different line."
    exit 5
fi

# Append only mode
if [ "$4" == "true" ]; then
    sed -ri "/command=\".*${repositoryName}.*\",restrict/ {/borg serve .*--append-only /! s|(borg serve )|\1--append-only |}" "$home/.ssh/authorized_keys"
elif [ "$4" == "false" ]; then
    sed -ri "/command=\".*${repositoryName}.*\",restrict/ s|(--append-only )||g" "$home/.ssh/authorized_keys"
fi

# Modify authorized_keys for the repositoryName: update the line with the quota and the SSH pub key
sed -ri "s|(command=\".*${repositoryName}.*--storage-quota ).*G\",restrict .*|\\1$3G\",restrict $2|g" "$home/.ssh/authorized_keys"
