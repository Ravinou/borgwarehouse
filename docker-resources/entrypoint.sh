#!/bin/bash
set -e

# Dockerfile values
dockerfileUser="borgwarehouse"
dockerfileUserid="1001"

# mapping uid/gid process owner to borgwarehouse user with nss_wrapper
#echo "Current user is $(id -u)"
user_id=$(id -u)
group_id=$(id -g)
export user_id group_id

origpasswd="/etc/passwd"
origgroup="/etc/group"
# As this container is runable in read-only mode, the new passwd file must be written
# within a mounted volume /tmp is also needed by supervisord
newpasswd="/tmp/passwd"
newgroup="/tmp/group"

# except if process owner is 1001
if [ "$(id -u)" != "$dockerfileUserid" ]; then
  # map user with borgwarehouse
  line=$(grep $dockerfileUser ${origpasswd} | awk -F ":" '{print $1":"$2":"ENVIRON["user_id"]":"ENVIRON["group_id"]":"$5":"$6":"$7}')
  cat ${origpasswd} | sed -E "s|^$dockerfileUser.*$|$line|" >${newpasswd}
  # map group with $dockerfileUser
  line=$(grep $dockerfileUser ${origgroup} | awk -F ":" '{print $1":x:"ENVIRON["group_id"]":"}')
  cat ${origgroup} | sed -E "s|^$dockerfileUser.*$|$line|" >${newgroup}
  export LD_PRELOAD=/usr/lib/libnss_wrapper.so
  export NSS_WRAPPER_PASSWD="${newpasswd}"
  export NSS_WRAPPER_GROUP="${newgroup}"
fi

# Generate ssh keys if not exist - is empty ?
if [ ! "$(ls -A "/etc/ssh")" ]; then
  ssh-keygen -A
fi

# Install sshd_config
if [ ! -f "/etc/ssh/sshd_config" ]; then
  cp /sshd_config.conf /etc/ssh/sshd_config
fi

# To avoid this error in log container at start : sync problem
# rsyslogd: imfile error trying to access state file for '/tmp/sshd.log': Permission denied [v8.2306.0 try https://www.rsyslog.com/e/2027 │
# rsyslogd: imfile error trying to access state file for '/tmp/borgwarehouse.log': Permission denied [v8.2306.0 try https://www.rsyslog.c
touch /tmp/sshd.log /tmp/borgwarehouse.log

exec "$@"
