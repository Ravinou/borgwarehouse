#!/bin/bash

dropbear -p 0.0.0.0:22 \
         -P /home/borgwarehouse/tmp/sshd.pid \
         -r /home/borgwarehouse/.ssh/ssh_host_ecdsa_key \
         -r /home/borgwarehouse/.ssh/ssh_host_ed25519_key \
         -r /home/borgwarehouse/.ssh/ssh_host_rsa_key \
         -s \
         -w \
         -m
