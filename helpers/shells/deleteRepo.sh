#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 1 arg : [repositoryName] with 8 char. length only.
# This shell **delete the repository** in arg and **all his data** and the line associated in the authorized_keys file.

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

# Check arg
if [[ $# -ne 1 || $1 = "" ]]; then
    echo -n "You must provide a repositoryName in argument."
    exit 1
fi

# Check if the repositoryName length is 8 char. With createRepo.sh our randoms have a length of 8 characters.
# If we receive another length there is necessarily a problem.
repositoryName=$1
if [ ${#repositoryName} != 8 ]; then
    echo -n "Error with the length of the repositoryName."
    exit 2
fi

# Delete the repository and the line associated in the authorized_keys file
if [ -d "${pool}/${repositoryName}" ]; then
        # Delete the repository
        rm -rf "${pool}/${repositoryName}"
        # Delete the line in the authorized_keys file
        sed -i "/${repositoryName}/d" "${authorized_keys}"
        echo -n "The folder "${pool}/${repositoryName}" and all its data have been deleted. The line associated in the authorized_keys file has been deleted."
else
        # Delete the line in the authorized_keys file
        sed -i "/${repositoryName}/d" "${authorized_keys}"
        echo -n "The folder "${pool}/${repositoryName}" did not exist (repository never initialized or used). The line associated in the authorized_keys file has been deleted."
fi