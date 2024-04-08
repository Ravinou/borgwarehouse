#!/bin/bash

# Only set if user <> 1001
if [ "$(id -u)" != "1001" ]; then
  # debian architecture discrimation
  machine=$(uname -m)
  LD_PRELOAD="/usr/lib/${machine,,}-linux-gnu/libnss_wrapper.so"
  NSS_WRAPPER_PASSWD="/home/borgwarehouse/tmp/passwd"
  NSS_WRAPPER_GROUP="/home/borgwarehouse/tmp/group"
  export LD_PRELOAD NSS_WRAPPER_PASSWD NSS_WRAPPER_GROUP
fi
