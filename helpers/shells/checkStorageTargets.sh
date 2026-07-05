#!/usr/bin/env bash

# Shell created by Raven for BorgWarehouse.
# Check the accessibility of external storage targets (mount points declared in
# the STORAGE_TARGETS environment variable).
# Each target path is passed as an argument. For every path we test, with a short
# timeout, whether it is a writable directory. The timeout guarantees that a dead
# mount (e.g. an unreachable SSHFS Hetzner Storage Box) cannot hang the request.
# stdout is a JSON array like :
# [
#     { "path": "/mnt/hetzner", "status": "online" },
#     { "path": "/mnt/nas", "status": "unreachable" }
# ]

# Exit when any command fails
set -e

# Build the JSON output. Each path is checked independently; the per-path timeout
# makes sure an unreachable mount is reported as "unreachable" instead of hanging
# the whole job.
output=$(
  for target in "$@"; do
    if timeout 5 test -d "$target" && timeout 5 test -w "$target"; then
      status="online"
    else
      status="unreachable"
    fi
    jq -n --arg path "$target" --arg status "$status" '{path: $path, status: $status}'
  done | jq -s '.'
)
if [ -z "$output" ]; then
  output="[]"
fi

# Print the JSON output
echo "$output"
