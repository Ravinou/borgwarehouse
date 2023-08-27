#!/usr/bin/env bash

################################################################################
# What is this script ?
# If you lose the repo.json file, this script will help you rebuild a new one.
# To do this, I've written this shell that reads the BorgWarehouse repository
# tree and generates a corresponding object.
# This script is only intended to be used in emergencies (data corruption,
# update problems...) and as a last resort to rebuild your repo.json file.

# Of course, certain parameters cannot be recovered, such as comments,
# repository size or aliases.
# You'll have to re-configure this from the web interface, but most of the work
# is done.

# This script should be used with the root user, as it is necessary to read
# authorized_keys files.

# This script simply displays a valid JSON object on your screen. Copy its
# entire content into the config/repo.json file.
# There's no need to restart BorgWarehouse, as this can be done on the fly.

# With the option `-a` or `--auto-size` the script calculates the current size
# of the repo and calculates the next largest two potency.
# By default the size is otherwise 2G.
# Examples for the calculation:
#
# | Size | Calc. |
# |-----:|------:|
# | <=2G |    2G |
# |   5G |    8G |
# |   9G |   16G |
# |  43G |   64G |
################################################################################

bwDataDir="/var/borgwarehouse"
directoriesList=$(ls -A $bwDataDir)
_AUTOSIZE=0

POSITIONAL_ARGS=()

# shellcheck disable=SC2221,SC2222
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--auto-size)
      _AUTOSIZE=1; shift ;;
    -*|--*)
      echo "Unknown option $1"; exit 1 ;;
    *)
      POSITIONAL_ARGS+=("$1") ; shift ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}" # restore positional parameters

function __repoSize() {
  if [ $_AUTOSIZE -eq 1 ]; then
    _repoSizeBytes=$(du --summarize --bytes "${1}" |
      grep --perl-regexp --only-matching '^\d+')
    if [ "$_repoSizeBytes" -le 2147483648 ]; then
      # Under 2G
      echo 2
    else
      # More than 2G, the next power of two is determined.
      _factor=2
      while true; do
        _repoSize=$((2**i))
        if [ 123 -lt $_repoSize ]; then
          echo $_repoSize
          break
        fi
        ((i++))
      done
    fi
  else
    echo "2"
  fi
}

finalObject="[]"
i=0
# Loop on each directory in bw-data
for directory in $directoriesList ; do
    unixUser=$directory
    repository=$(ls "$bwDataDir/$directory/repos/")
    id=$i
    alias="Repo to rename $i"
    lastSave=0
    alert=90000
    storageSize=$(__repoSize "$bwDataDir/$directory/repos/$repository")
    storageUsed=0
    comment=""
    displayDetails=true
    status=false
    sshPublicKey=$(grep --only-matching --perl-regexp \
      '(?<=restrict ).*' \
      "$bwDataDir/$directory/.ssh/authorized_keys")

    # Create a valid JSON object with jq for each repo
    objRepoJSON=$(jq -n --argjson id $id \
                        --arg alias "$alias" \
                        --arg repository "$repository" \
                        --argjson status $status \
                        --argjson lastSave $lastSave \
                        --argjson alert $alert \
                        --argjson storageSize "$storageSize" \
                        --argjson storageUsed $storageUsed \
                        --arg sshPublicKey "$sshPublicKey" \
                        --arg comment "$comment" \
                        --argjson displayDetails $displayDetails \
                        --arg unixUser "$unixUser" \
                        "{ \
                          id:             \$id,             \
                          alias:          \$alias,          \
                          repository:     \$repository,     \
                          status:         \$status,         \
                          lastSave:       \$lastSave,       \
                          alert:          \$alert,          \
                          storageSize:    \$storageSize,    \
                          storageUsed:    \$storageUsed,    \
                          sshPublicKey:   \$sshPublicKey,   \
                          comment:        \$comment,        \
                          displayDetails: \$displayDetails, \
                          unixUser:       \$unixUser        \
                        }")

    # Insert objRepoJSON in finalObject with jq
    finalObject=$(jq --argjson objRepoJSON  \
      "$objRepoJSON" '. += [$objRepoJSON]' \
      <<< "$finalObject")

    i=$((i+1))
done

#Display finalObject on screen to copy/paste it in repo.json file
echo "$finalObject"
