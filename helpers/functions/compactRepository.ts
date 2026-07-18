import { toast, ToastOptions } from 'react-toastify';

/**
 * Trigger a server-side `borg compact` on a repository.
 *
 * The request is aborted client-side after 30s.
 * The server keeps running `borg compact` to completion regardless:
 * on a large compaction I inform the user that it continues in the background.
 * I'll see if I have any insights on this topic, but it's up for debate.
 * Most compaction processes will take less than 30 seconds.
 * And for the longer ones, no one is going to wait around in front of a UI...
 */
export async function compactRepository(
  repositoryName: string,
  toastOptions: ToastOptions = { position: 'top-right', autoClose: 5000 }
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('/api/v1/repositories/' + repositoryName + '/compact', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      signal: controller.signal,
    });
    if (response.ok) {
      toast.success(`📦 The repository ${repositoryName} has been compacted.`, toastOptions);
    } else if (response.status === 409) {
      toast.warning('A compaction is already running for this repository.', toastOptions);
    } else if (response.status === 403) {
      toast.warning('Compaction is disabled on this server.', toastOptions);
    } else {
      const errorMessage = await response.json();
      toast.error(
        `An error has occurred : ${errorMessage.message?.stderr ?? errorMessage.message}`,
        toastOptions
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      toast.info(
        'Compaction is taking a while and continues in the background. Refresh the storage in a moment to see the space reclaimed.',
        { ...toastOptions, autoClose: 10000 }
      );
    } else {
      toast.error('An error has occurred', toastOptions);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
