import { execFileSync } from 'node:child_process';
import { COMPOSE_FILE } from './env';

export function compose(args: string[], options: { input?: string } = {}): string {
  return execFileSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    encoding: 'utf8',
    input: options.input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function execIn(service: 'borgwarehouse' | 'client', script: string, user?: string): string {
  const userArgs = user ? ['-u', user] : [];
  return compose(['exec', '-T', ...userArgs, service, 'bash', '-c', script]);
}

export function serverLogs(): string {
  return compose(['logs', '--no-color', 'borgwarehouse']);
}
