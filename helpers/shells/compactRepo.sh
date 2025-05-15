#!/usr/bin/env bash

# Shell created by Forceu for BorgWarehouse.
# This shell takes 1 arg : [repositoryName] with 8 char. length only.
# This shell compacts the repository in arg.

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

# Check arg
if [[ $# -ne 1 || $1 = "" ]]; then
    echo -n "You must provide a repositoryName in argument." >&2
    exit 1
fi

# Check if the repositoryName pattern is an hexa 8 char. With createRepo.sh our randoms are hexa of 8 characters.
# If we receive another pattern there is necessarily a problem.
repositoryName=$1
if ! [[ "$repositoryName" =~ ^[a-f0-9]{8}$ ]]; then
  echo "Invalid repository name. Must be an 8-character hex string." >&2
  exit 2
fi


# Check if borgbackup is installed
if ! [ -x "$(command -v borg)" ]; then
  echo -n "You must install borgbackup package." >&2
  exit 3
fi

# Compact the repository
if [ -d "${pool}/${repositoryName}" ]; then
  # Compacting
  borg compact "${pool}"/"${repositoryName}"
  echo -n "Compacting of ""${repositoryName}"" complete"
else
  echo "Repository path does not exist" >&2
  exit 4
fi
