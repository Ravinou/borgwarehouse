export default function lanCommandOption(wizardEnv, lanCommand) {
    let FQDN;
    let SSH_SERVER_PORT;
    if (lanCommand && wizardEnv.FQDN_LAN && wizardEnv.SSH_SERVER_PORT_LAN) {
        FQDN = wizardEnv.FQDN_LAN;
        SSH_SERVER_PORT =
            wizardEnv.SSH_SERVER_PORT_LAN === 'false'
                ? ''
                : ':' + wizardEnv.SSH_SERVER_PORT_LAN;
    } else {
        FQDN = wizardEnv.FQDN;
        SSH_SERVER_PORT =
            wizardEnv.SSH_SERVER_PORT === 'false'
                ? ''
                : ':' + wizardEnv.SSH_SERVER_PORT;
    }

    return { FQDN, SSH_SERVER_PORT };
}
