#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# Get the timestamp of the last modification of the file integrity.* for of all repositories in a JSON output.
# stdout will be an array like :
# [
#   {
#     "user": "09d8240f",
#     "lastSave": 1668513608
#   },
#   {
#     "user": "635a6f8b",
#     "lastSave": 1667910810
#   },
#   {
#     "user": "83bd4ef1",
#     "lastSave": 1667985985
#   }
# ]


# Exit when any command fails
set -e

stat --format='{"user":"%U","lastSave":%Y}' \
  /var/borgwarehouse/*/repos/*/integrity* |
  jq --slurp
