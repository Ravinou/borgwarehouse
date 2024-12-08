#!/usr/bin/env bash

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

# Get the size of each repository and format as JSON
cd "${home}"/repos
output=$(du -s -- * 2>/dev/null | awk '{print "{\"size\":" $1 ",\"name\":\"" $2 "\"}"}' | jq -s '.')
if [ -z "$output" ]; then
  output="[]"
fi

# Print the JSON output
echo "$output"
