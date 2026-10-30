import { generateKeyPairSync, randomBytes } from 'node:crypto';

function sshString(data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, data]);
}

export function generateSshPublicKey(comment = 'e2e@playwright'): string {
  const { publicKey } = generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  const type = Buffer.from('ssh-ed25519');
  const blob = Buffer.concat([sshString(type), sshString(raw)]);
  return `ssh-ed25519 ${blob.toString('base64')} ${comment}`;
}

export function uniqueName(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex')}`;
}
