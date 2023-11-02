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

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

# Use jc to output a JSON format with du command
cd "${home}"/repos
du -s -- * | jc --du
