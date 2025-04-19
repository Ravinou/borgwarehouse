import { describe, it, expect } from 'vitest';
import lanCommandOption from './lanCommandOption';
import { WizardEnvType } from '~/types';

describe('lanCommandOption', () => {
  it('should return undefined values when wizardEnv is not provided', () => {
    const result = lanCommandOption();
    expect(result).toEqual({ FQDN: undefined, SSH_SERVER_PORT: undefined });
  });

  it('should return FQDN and SSH_SERVER_PORT from wizardEnv when lanCommand is false', () => {
    const wizardEnv: Partial<WizardEnvType> = {
      FQDN: 'example.com',
      FQDN_LAN: 'lan.example.com',
      SSH_SERVER_PORT: '22',
      SSH_SERVER_PORT_LAN: '2222',
      HIDE_SSH_PORT: 'false',
    };

    const result = lanCommandOption(wizardEnv, false);
    expect(result).toEqual({ FQDN: 'example.com', SSH_SERVER_PORT: ':22' });
  });

  it('should return FQDN_LAN and SSH_SERVER_PORT_LAN from wizardEnv when lanCommand is true', () => {
    const wizardEnv: Partial<WizardEnvType> = {
      FQDN: 'example.com',
      FQDN_LAN: 'lan.example.com',
      SSH_SERVER_PORT: '22',
      SSH_SERVER_PORT_LAN: '2222',
      HIDE_SSH_PORT: 'false',
    };

    const result = lanCommandOption(wizardEnv, true);
    expect(result).toEqual({ FQDN: 'lan.example.com', SSH_SERVER_PORT: ':2222' });
  });

  it('should return undefined for SSH_SERVER_PORT when HIDE_SSH_PORT is true', () => {
    const wizardEnv: Partial<WizardEnvType> = {
      FQDN: 'example.com',
      FQDN_LAN: 'lan.example.com',
      SSH_SERVER_PORT: '22',
      SSH_SERVER_PORT_LAN: '2222',
      HIDE_SSH_PORT: 'true',
    };

    const result = lanCommandOption(wizardEnv, false);
    expect(result).toEqual({ FQDN: 'example.com', SSH_SERVER_PORT: undefined });
  });

  it('should fallback to FQDN and should leave ssh server port to undefined for some usages', () => {
    const wizardEnv: Partial<WizardEnvType> = {
      FQDN: 'example.com',
      FQDN_LAN: undefined,
      SSH_SERVER_PORT: '22',
      SSH_SERVER_PORT_LAN: undefined,
      HIDE_SSH_PORT: 'false',
    };

    const result = lanCommandOption(wizardEnv, true);
    expect(result).toEqual({ FQDN: 'example.com', SSH_SERVER_PORT: undefined });
  });

  it('should handle missing FQDN and SSH_SERVER_PORT gracefully', () => {
    const wizardEnv: Partial<WizardEnvType> = {
      FQDN: undefined,
      FQDN_LAN: 'lan.example.com',
      SSH_SERVER_PORT: undefined,
      SSH_SERVER_PORT_LAN: '2222',
      HIDE_SSH_PORT: 'false',
    };

    const result = lanCommandOption(wizardEnv, false);
    expect(result).toEqual({ FQDN: undefined, SSH_SERVER_PORT: undefined });
  });
});
