#!/usr/bin/env bash

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

if [ -n "$(find -L "${home}"/repos -mindepth 1 -maxdepth 1 -type d)" ]; then
  stat --format='{"repositoryName":"%n","lastSave":%Y}' \
  "${home}"/repos/*/integrity* | 
  jq --slurp '[.[] | .repositoryName = (.repositoryName | split("/")[-2])]'
else
    echo "[]"
fi