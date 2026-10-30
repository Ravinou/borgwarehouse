import { describe, it, expect } from 'vitest';
import sshPublicKeyCheck from './sshPublicKeyCheck';

const ED25519 = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEXAMPLEbodyEXAMPLEbodyEXAMPLE';

describe('sshPublicKeyCheck', () => {
  it('should accept valid keys with or without comment', () => {
    expect(sshPublicKeyCheck(ED25519)).toBe(true);
    expect(sshPublicKeyCheck(`${ED25519} user@host`)).toBe(true);
    expect(sshPublicKeyCheck(`${ED25519} my laptop-2024_v1.0`)).toBe(true);
    expect(sshPublicKeyCheck('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB== user@host')).toBe(true);
    expect(
      sshPublicKeyCheck(
        'sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIEXAMPLE user'
      )
    ).toBe(true);
  });

  it('should reject newline injection (GHSA-fp7p-783f-hvpg)', () => {
    expect(sshPublicKeyCheck(`${ED25519}\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIATTACKER x`)).toBe(
      false
    );
    expect(sshPublicKeyCheck(`${ED25519} dummy\nssh-ed25519 AAAAATTACKER`)).toBe(false);
    expect(sshPublicKeyCheck(`\n${ED25519}`)).toBe(false);
    expect(sshPublicKeyCheck(`${ED25519}\n`)).toBe(false);
    expect(sshPublicKeyCheck(`${ED25519} x\rfoo`)).toBe(false);
  });

  it('should reject shell/sed metacharacters in the comment', () => {
    expect(sshPublicKeyCheck(`${ED25519} x;touch /tmp/pwn;#|e;#`)).toBe(false);
    expect(sshPublicKeyCheck(`${ED25519} a&b`)).toBe(false);
    expect(sshPublicKeyCheck(`${ED25519} a\\b`)).toBe(false);
    expect(sshPublicKeyCheck(`${ED25519} "quoted"`)).toBe(false);
  });

  it('should reject unknown key types and non-string values', () => {
    expect(sshPublicKeyCheck('ssh-dss AAAAB3NzaC1kc3M')).toBe(false);
    expect(sshPublicKeyCheck('')).toBe(false);
    expect(sshPublicKeyCheck(undefined)).toBe(false);
    expect(sshPublicKeyCheck(null)).toBe(false);
  });
});
