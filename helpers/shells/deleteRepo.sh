#!/bin/bash

# Shell created by Raven for BorgWarehouse.
# This shell takes 1 arg : [user] with 8 char. length only.
# This shell **delete the user** in arg and **all his data**.

# Exit when any command fails
set -e

# Check arg
if [[ $# -ne 1 || $1 = "" ]]; then
    echo "You must provide a username in argument."
    exit 1
fi

# Check if username length is 8 char. With createRepo.sh our randoms have a length of 8 characters.
# If we receive another length there is necessarily a problem.
username=$1
if [ ${#username} != 8 ]
then
    echo "Error with the length of the username."
    exit 2
fi

# Delete the user if it exists
if id "$1" &>/dev/null; then
    sudo userdel -rf "$1"
    echo "The user $1 and all his data have been deleted"
else
    echo "The user $1 does not exist"
    exit 3
fi
