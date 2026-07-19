#!/usr/bin/env bash

### DEPRECATED ### NodeJS will handle this in the future.

# Shell created by Raven for BorgWarehouse.
# This shell takes 2 args : [repositoryName] (8 hex char.) and [archive] (true|false).
# It "freezes" or "unfreezes" a repository purely server-side, without ever
# needing the repository passphrase:
#   -archive (true): the authorized_keys forced-command line for this repo is
#                       disabled by prefixing it with the "#BW-ARCHIVED " marker.
#                       The client can no longer connect at all (no push, no
#                       prune, no restore) so the repository is effectively
#                       read-only/locked. The line is preserved verbatim so the
#                       exact SSH key, quota and append-only settings survive.
#   - unarchive (false) : the "#BW-ARCHIVED " marker is removed, restoring access.
# The repository data on disk is never touched.

# Exit when any command fails
set -e

# Load .env if exists
if [[ -f .env ]]; then
    source .env
fi

# Default value if .env not exists
: "${home:=/home/borgwarehouse}"

authorized_keys="${home}/.ssh/authorized_keys"
marker="#BW-ARCHIVED "

# Check args
if [[ $# -ne 2 || $1 = "" ]] || { [[ "$2" != "true" ]] && [[ "$2" != "false" ]]; }; then
    echo -n "This shell takes 2 args : [repositoryName] [archive true|false]." >&2
    exit 1
fi

# Check if the repositoryName pattern is an hexa 8 char. With createRepo.sh our randoms are hexa of 8 characters.
# If we receive another pattern there is necessarily a problem.
repositoryName=$1
if ! [[ "$repositoryName" =~ ^[a-f0-9]{8}$ ]]; then
    echo "Invalid repository name. Must be an 8-character hex string." >&2
    exit 2
fi

# The authorized_keys file must exist.
if [ ! -f "${authorized_keys}" ]; then
    echo -n "${authorized_keys} must be present" >&2
    exit 3
fi

# A line (archived or not) referencing this repository must exist.
if ! grep -q "command=\".*${repositoryName}.*\",restrict" "${authorized_keys}"; then
    echo -n "No line containing ${repositoryName} found in authorized_keys" >&2
    exit 4
fi

if [ "$2" == "true" ]; then
    # Archive: add the marker to the repo line if it is not already prefixed.
    sed -ri "/^${marker}/! {/command=\".*${repositoryName}.*\",restrict/ s|^|${marker}|}" "${authorized_keys}"
    echo -n "The repository ${repositoryName} has been archived."
else
    # Unarchive: remove the marker from the repo line.
    sed -ri "/^${marker}.*command=\".*${repositoryName}.*\",restrict/ s|^${marker}||" "${authorized_keys}"
    echo -n "The repository ${repositoryName} has been unarchived."
fi
