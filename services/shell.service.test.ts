import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'node:child_process';
import { ShellService } from './shell.service';

vi.mock('node:child_process', () => ({
  execFile: vi.fn((_file: string, _args: string[], callback: (...args: unknown[]) => void) =>
    callback(null, { stdout: 'abcd1234', stderr: '' })
  ),
}));

const LEGIT = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExamplekeydata12345';
// Exact payload from GHSA-8wgf-6r65-4qv9
const NEWLINE_PAYLOAD = `${LEGIT}\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAttackerKey attacker@evil`;
const CR_PAYLOAD = `${LEGIT}\r\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAttackerKey attacker@evil`;

describe('ShellService SSH key injection (GHSA-8wgf-6r65-4qv9)', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockClear();
  });

  it.each([
    ['\\n', NEWLINE_PAYLOAD],
    ['\\r\\n', CR_PAYLOAD],
  ])(
    'createRepo rejects a key with an embedded %s without calling the shell',
    async (_label, payload) => {
      await expect(ShellService.createRepo(payload, 10, false)).rejects.toThrow(
        'Invalid SSH key format'
      );
      expect(execFile).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['\\n', NEWLINE_PAYLOAD],
    ['\\r\\n', CR_PAYLOAD],
  ])(
    'updateRepo rejects a key with an embedded %s without calling the shell',
    async (_label, payload) => {
      await expect(ShellService.updateRepo('abcd1234', payload, 10, false)).rejects.toThrow(
        'Invalid SSH key format'
      );
      expect(execFile).not.toHaveBeenCalled();
    }
  );

  it('createRepo still accepts a legitimate key', async () => {
    await ShellService.createRepo(`${LEGIT} user@host`, 10, false);
    expect(execFile).toHaveBeenCalledTimes(1);
  });
});
