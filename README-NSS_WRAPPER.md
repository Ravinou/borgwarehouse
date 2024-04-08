## What's nss_wrapper

source: https://packages.debian.org/bookworm/libnss-wrapper

[...]
NSS wrapper library:

There are projects which provide daemons needing to be able to create, modify and delete unix users. Or just switch user ids to interact with the system, for example a user space file server. To be able to test that you need the privilege to modify the passwd and groups file. With nss_wrapper it is possible to define your own passwd and groups file which will be used by software to act correctly while under test.

If you have a client and server under test they normally use functions to resolve network names to addresses (DNS) or vice versa. The nss_wrappers allow you to create a hosts file to setup name resolution for the addresses you use with socket_wrapper.
[...]

## Build

No change, you build your production container as usual, it will be built with the default user/group runner: 1001/1001.

## Run with default values (UID/GID: 1001/1001)

If you don't specify a user/group, the container will run as 1001:1001.
To check, start the container and connect to its console, then run `id`, user:group are 1001

### Run with specific user/group

You must supply the user/group to the docker container with the '-u [UID] :[GID]' parameter (note that your file systems must be configured to accept these identifiers in read/write mode).
To check, start the container and connect to its console, then run `id`, user:group are [UID] & [GID] provided.

This build configuration should also enable it to be used on Openshift.
