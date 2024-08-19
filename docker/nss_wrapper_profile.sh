#!/usr/bin/sh

NSS_WRAPPER_PASSWD="/home/borgwarehouse/tmp/passwd"
NSS_WRAPPER_GROUP="/home/borgwarehouse/tmp/group"
LD_PRELOAD="libnss_wrapper.so"
export NSS_WRAPPER_PASSWD NSS_WRAPPER_GROUP LD_PRELOAD
