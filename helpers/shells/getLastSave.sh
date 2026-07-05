#!/usr/bin/env bash

### DEPRECATED ### NodeJS will handle this in the future.

# Shell created by Raven for BorgWarehouse.
# Get the timestamp of the last modification of the file integrity.* for of all repositories in a JSON output.
# stdout will be an array like :
# [
#   {
#     "repositoryName": "a7035047",
#     "lastSave": 1691341603
#   },
#   {
#     "repositoryName": "a7035048",
#     "lastSave": 1691342688
#   }
# ]


# Exit when any command fails
set -e

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

# Get the timestamp of the last backup (most recent "integrity.*" file mtime) for
# each repository. Each repository is inspected independently with a per-repository
# timeout so that an unreachable external storage (e.g. a dead SSHFS mount) cannot
# hang the whole job: the faulty repository is simply skipped.
shopt -s nullglob
output=$(
  for repo in "${home}"/repos/*; do
    name=$(basename "$repo")
    # Expand the integrity* glob and stat it inside the timeout'd subprocess so
    # that an unreachable external storage (dead mount) cannot hang the shell.
    # shellcheck disable=SC2016 # $1 is intentionally expanded by the inner bash -c, not here
    ts=$(timeout 60 bash -c 'stat -c %Y "$1"/integrity* 2>/dev/null | sort -n | tail -1' _ "$repo")
    if [ -n "$ts" ]; then
      printf '{"repositoryName":"%s","lastSave":%s}\n' "$name" "$ts"
    fi
  done | jq -s '.'
)
if [ -z "$output" ]; then
  output="[]"
fi

echo "$output"