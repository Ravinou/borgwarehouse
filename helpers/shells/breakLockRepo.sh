#!/usr/bin/env bash

### DEPRECATED ### NodeJS will handle this in the future.

# Shell created by Raven for BorgWarehouse.
# This shell takes 1 arg : [repositoryName] with 8 char. length only.
# It runs `borg break-lock` on the repository to release a stale lock left behind
# by an interrupted operation (e.g. a `borg compact` killed by a container
# restart). `borg break-lock` never needs the repository passphrase, so it is
# safe to run server-side.

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

# The repository can be a real directory or a symlink to an external storage.
repo_path="${pool}/${repositoryName}"
if [ ! -d "${repo_path}" ]; then
    echo "The repository ${repositoryName} does not exist or has never been initialized." >&2
    exit 3
fi

# Release the lock. No passphrase is required for `borg break-lock`.
# Disable interactive prompts so the command can never hang waiting for input.
export BORG_RELOCATED_REPO_ACCESS_IS_OK=yes
export BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK=yes
borg break-lock "${repo_path}"

echo -n "The lock on repository ${repositoryName} has been released."
