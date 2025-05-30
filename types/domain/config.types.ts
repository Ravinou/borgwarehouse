import { IntegrationTokenType } from '../api/integration.types';

export type Repository = {
  id: number;
  alias: string;
  repositoryName: string;
  status: boolean;
  lastSave: number;
  alert?: number;
  storageSize: number;
  storageUsed: number;
  sshPublicKey: string;
  comment: string;
  displayDetails?: boolean; // @deprecated
  unixUser?: string; // @deprecated
  lanCommand?: boolean;
  appendOnlyMode?: boolean;
  lastStatusAlertSend?: number;
};

export type BorgWarehouseUser = {
  id: number;
  username: string;
  password: string;
  roles: string[];
  email: string;
  emailAlert?: boolean;
  appriseAlert?: boolean;
  appriseMode?: AppriseModeEnum;
  appriseStatelessURL?: string;
  appriseServices?: string[];
  tokens?: Array<IntegrationTokenType>;
};

export enum WizardEnvEnum {
  UNIX_USER = 'UNIX_USER',
  FQDN = 'FQDN',
  SSH_SERVER_PORT = 'SSH_SERVER_PORT',
  FQDN_LAN = 'FQDN_LAN',
  SSH_SERVER_PORT_LAN = 'SSH_SERVER_PORT_LAN',
  SSH_SERVER_FINGERPRINT_RSA = 'SSH_SERVER_FINGERPRINT_RSA',
  SSH_SERVER_FINGERPRINT_ECDSA = 'SSH_SERVER_FINGERPRINT_ECDSA',
  SSH_SERVER_FINGERPRINT_ED25519 = 'SSH_SERVER_FINGERPRINT_ED25519',
  HIDE_SSH_PORT = 'HIDE_SSH_PORT',
  DISABLE_INTEGRATIONS = 'DISABLE_INTEGRATIONS',
  DISABLE_DELETE_REPO = 'DISABLE_DELETE_REPO',
}

export type WizardEnvType = Record<WizardEnvEnum, string>;

export enum AppriseModeEnum {
  PACKAGE = 'package',
  STATELESS = 'stateless',
}
