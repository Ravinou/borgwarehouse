/**
 * Checks if the given SSH public key is duplicated in the provided repository list by removing the comment part.
 *
 * @param {string} pubKey - The SSH public key to check.
 * @param {Array} repoList - The list of repositories with their SSH public keys.
 * @returns {boolean} - Returns true if the SSH public key is duplicated, otherwise false.
 * @throws {Error} - Throws an error if required parameters are missing or invalid.
 */
export default function isSshPubKeyDuplicate(pubKey, repoList) {
  if (!pubKey || !repoList || !Array.isArray(repoList)) {
    throw new Error('Missing or invalid parameters for duplicate SSH public key check.');
  }

  // Compare the key part only by removing the comment
  const pubKeyWithoutComment = pubKey.split(' ').slice(0, 2).join(' ');

  // Check if the normalized key is already in the repository list
  return repoList.some((repo) => {
    const repoSshKeyWithoutComment = repo.sshPublicKey.split(' ').slice(0, 2).join(' ');
    return repoSshKeyWithoutComment === pubKeyWithoutComment;
  });
}
