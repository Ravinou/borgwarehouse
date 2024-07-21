#!/bin/bash bash

# This shell can be called to execute all cronjobs to refresh the instance
# This may be enabled as a setting to refresh the storage used after any borg serve command finishes

source /home/borgwarehouse/app/.env

curl --request POST --url "${NEXTAUTH_URL}/api/cronjob/checkStatus" --header "Authorization: Bearer ${CRONJOB_KEY}"
curl --request POST --url "${NEXTAUTH_URL}/api/cronjob/getStorageUsed" --header "Authorization: Bearer ${CRONJOB_KEY}"