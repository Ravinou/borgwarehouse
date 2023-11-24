#!/bin/bash
# Only set if user <> 1001 - nss_wrapper for others
if [ "$UID" != "1001" ]; then
    LD_PRELOAD="/usr/lib/libnss_wrapper.so"
    NSS_WRAPPER_PASSWD="/tmp/passwd"
    NSS_WRAPPER_GROUP="/tmp/group"
    export LD_PRELOAD NSS_WRAPPER_PASSWD NSS_WRAPPER_GROUP
fi
