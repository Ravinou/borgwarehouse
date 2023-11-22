#!/bin/bash
set -e

# Dockerfile values
dockerfileUser="borgwarehouse"
dockerfileUserid="1001"
dockerfileVolume="/etc_ssh"

# mapping uid/gid process owner to borgwarehouse user with nss_wrapper
#echo "Current user is $(id -u)"
user_id=$(id -u)
group_id=$(id -g)
export user_id group_id

origpasswd="/etc/passwd"
origgroup="/etc/group"
# As this container is runable in read-only mode, the new passwd file must be written in one mounted volume
# /etc_ssh/etc/ssh/ is volume in this case
newpasswd="$dockerfileVolume/etc/ssh/passwd"
newgroup="$dockerfileVolume/etc/ssh/group"

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
if [ ! "$(ls -A "$dockerfileVolume/etc/ssh")" ]; then
  ssh-keygen -A -f $dockerfileVolume
fi
# Install sshd_config
if [ ! -f "$dockerfileVolume/etc/ssh/sshd_config" ]; then
  cp /sshd_config.conf $dockerfileVolume/etc/ssh/sshd_config
fi
# Starting sshd daemon and log to file... change LOGLEVEL in sshd_config
/usr/sbin/sshd -f $dockerfileVolume/etc/ssh/sshd_config -E $dockerfileVolume/etc/ssh/sshd.log

exec "$@"
