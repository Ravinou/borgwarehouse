#!/usr/bin/env bash

### DEPRECATED ### NodeJS will handle this in the future.

# Shell created by Raven for BorgWarehouse.
# This shell takes 1 arg : [repositoryName] with 8 char. length only.
# It runs `borg compact` on the repository to reclaim disk space that clients
# have already marked for deletion (via their own prune). `borg compact` never
# needs the repository passphrase, so it is safe to run server-side and is
# fully compatible with append-only mode.

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

# Run the compaction. No passphrase is required for `borg compact`.
# Force borg to use the application user's home for its config/cache/security
# directories. Without this, borg falls back to $HOME (e.g. /root in the
# container) which is not writable by the app user -> "Permission denied: '/root/.cache'".
export BORG_BASE_DIR="${home}"
# Disable interactive prompts so the command can never hang waiting for input.
export BORG_RELOCATED_REPO_ACCESS_IS_OK=yes
export BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK=yes
# --lock-wait 10: if a client backup is in progress, wait up to 10s for the repo
# lock to be released instead of failing immediately.
borg compact --lock-wait 10 "${repo_path}"

echo -n "The repository ${repositoryName} has been compacted."
