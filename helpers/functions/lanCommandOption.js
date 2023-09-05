export default function lanCommandOption(wizardEnv, lanCommand) {
    let HOSTNAME;
    let SSH_SERVER_PORT;
    if (lanCommand && wizardEnv.HOSTNAME_LAN && wizardEnv.SSH_SERVER_PORT_LAN) {
        HOSTNAME = wizardEnv.HOSTNAME_LAN;
        SSH_SERVER_PORT = wizardEnv.SSH_SERVER_PORT_LAN;
    } else {
        HOSTNAME = wizardEnv.HOSTNAME;
        SSH_SERVER_PORT = wizardEnv.SSH_SERVER_PORT;
    }

    return { HOSTNAME, SSH_SERVER_PORT };
}
