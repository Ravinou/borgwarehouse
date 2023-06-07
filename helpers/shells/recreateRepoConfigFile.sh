#!/bin/bash

##############################################################################################################
# What is this script ?
# If you lose the repo.json file, this script will help you rebuild a new one.
# To do this, I've written this shell that reads the BorgWarehouse repository tree and generates a corresponding object.
# This script is only intended to be used in emergencies (data corruption, update problems...) and as a last resort to rebuild your repo.json file.

# Of course, certain parameters cannot be recovered, such as comments, repository size or aliases.
# You'll have to re-configure this from the web interface, but most of the work is done.

# This script should be used with the root user, as it is necessary to read authorized_keys files.

# This script simply displays a valid JSON object on your screen. Copy its entire content into the config/repo.json file.
# There's no need to restart BorgWarehouse, as this can be done on the fly.
##############################################################################################################

bwDataDir="/var/borgwarehouse"
directoriesList=$(ls -A $bwDataDir)


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
    storageSize=2
    storageUsed=0
    comment=""
    displayDetails=true
    status=false
    sshPublicKey=$(grep -oP '(?<=restrict ).*' "$bwDataDir/$directory/.ssh/authorized_keys" )

    # Create a valid JSON object with jq for each repo
    objRepoJSON=$(jq -n --argjson id $id \
                        --arg alias "$alias" \
                        --arg repository "$repository" \
                        --argjson status $status \
                        --argjson lastSave $lastSave \
                        --argjson alert $alert \
                        --argjson storageSize $storageSize \
                        --argjson storageUsed $storageUsed \
                        --arg sshPublicKey "$sshPublicKey" \
                        --arg comment "$comment" \
                        --argjson displayDetails $displayDetails \
                        --arg unixUser "$unixUser" \
                        '{id: $id, alias: $alias, repository: $repository, status: $status, lastSave: $lastSave, alert: $alert, storageSize: $storageSize, storageUsed: $storageUsed, sshPublicKey: $sshPublicKey, comment: $comment, displayDetails: $displayDetails, unixUser: $unixUser}')

    # Insert objRepoJSON in finalObject with jq
    finalObject=$(jq --argjson objRepoJSON "$objRepoJSON" '. += [$objRepoJSON]' <<< "$finalObject")

    i=$((i+1))
done

#Display finalObject on screen to copy/paste it in repo.json file
echo "$finalObject"
