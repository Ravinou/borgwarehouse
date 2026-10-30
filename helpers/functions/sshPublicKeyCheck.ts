// The key ends up in authorized_keys (createRepo.sh) and in a sed expression (updateRepo.sh):
// only a single line, a known key type, base64 body and a comment with a safe charset are allowed.
// No trimming here: the exact value validated is the one passed to the shells.
const SSH_PUBLIC_KEY_REGEX =
  /^(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh\.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+={0,3}( [A-Za-z0-9@._:+=,-]+)*$/;

export default function sshPublicKeyCheck(key: unknown): boolean {
  return typeof key === 'string' && SSH_PUBLIC_KEY_REGEX.test(key);
}
