#!/usr/bin/env bash

### DEPRECATED ### NodeJS will handle this in the future.

# Shell created by Raven for BorgWarehouse.
# Get the size of all repositories in a JSON output.
# stdout will be an array like :
# [
#     { size: 32, name: '10e73223' },
#     { size: 1155672, name: '83bd4ef1' },
#     { size: 112, name: '635a6f8b' },
#     { size: 32, name: 'bce68e87' },
#     { size: 44, name: 'e4c04552' },
# ];

# Exit when any command fails
set -e

# Ignore "lost+found" directories
GLOBIGNORE="LOST+FOUND:lost+found"

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

# Get the size of each repository and format as JSON.
# Each repository is measured independently with a per-repository timeout so that
# an unreachable external storage (e.g. a dead SSHFS mount) cannot hang the whole
# job: the faulty repository is simply skipped and the others are still reported.
cd "${home}"/repos
shopt -s nullglob
output=$(
  for repo in *; do
    size=$(timeout 60 du -s -L -- "$repo" 2>/dev/null | awk 'NR==1{print $1}')
    if [ -n "$size" ]; then
      printf '{"size":%s,"name":"%s"}\n' "$size" "$repo"
    fi
  done | jq -s '.'
)
if [ -z "$output" ]; then
  output="[]"
fi

# Print the JSON output
echo "$output"
