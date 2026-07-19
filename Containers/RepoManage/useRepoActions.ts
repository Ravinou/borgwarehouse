import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { useSWRConfig } from 'swr';
import { useLoader } from '~/contexts/LoaderContext';
import { Repository } from '~/types';

const toastOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export function useRepoActions(targetRepo?: Repository) {
  const router = useRouter();
  const { start, stop } = useLoader();
  const { mutate } = useSWRConfig();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [breakLockDialog, setBreakLockDialog] = useState(false);
  const [isBreakingLock, setIsBreakingLock] = useState(false);
  const [archiveDialog, setArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  //Delete a repo
  const confirmDelete = async () => {
    const repositoryName = targetRepo?.repositoryName;
    setIsDeleting(true);
    start();
    if (!repositoryName) {
      stop();
      setIsDeleting(false);
      toast.error('Repository name not found', toastOptions);
      router.replace('/');
      return;
    }
    await fetch('/api/v1/repositories/' + repositoryName, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json',
      },
    })
      .then(async (response) => {
        if (response.ok) {
          toast.success(
            '🗑 The repository ' + repositoryName + ' has been successfully deleted',
            toastOptions
          );
          await mutate('/api/v1/repositories');
          router.replace('/');
        } else if (response.status == 403) {
          toast.warning(
            '🔒 The server is currently protected against repository deletion.',
            toastOptions
          );
          router.replace('/');
        } else {
          const errorMessage = await response.json();
          toast.error(`An error has occurred : ${errorMessage.message.stderr}`, toastOptions);
          router.replace('/');
          console.log('Fail to delete');
        }
      })
      .catch((error) => {
        toast.error('An error has occurred', toastOptions);
        router.replace('/');
        console.log(error);
      })
      .finally(() => {
        stop();
        setIsDeleting(false);
      });
  };

  //Break a stale lock on a repo (server-side `borg break-lock`, no passphrase required)
  const confirmBreakLock = async () => {
    const repositoryName = targetRepo?.repositoryName;
    if (!repositoryName) {
      toast.error('Repository name not found', toastOptions);
      return;
    }
    setIsBreakingLock(true);
    try {
      const response = await fetch('/api/v1/repositories/' + repositoryName + '/break-lock', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
      });
      if (response.ok) {
        toast.success(`🔓 The lock on ${repositoryName} has been released.`, toastOptions);
      } else {
        const errorMessage = await response.json();
        toast.error(
          `An error has occurred : ${errorMessage.message?.stderr ?? errorMessage.message}`,
          toastOptions
        );
      }
    } catch (error) {
      toast.error('An error has occurred', toastOptions);
    } finally {
      setIsBreakingLock(false);
      setBreakLockDialog(false);
    }
  };

  // Archive (freeze) or unarchive a repository. Archiving disables the client's
  // SSH access server-side (no passphrase needed): no push, prune or restore,
  // and no more notifications. Fully reversible; repository data is untouched.
  const setArchived = async (archived: boolean) => {
    const repositoryName = targetRepo?.repositoryName;
    if (!repositoryName) {
      toast.error('Repository name not found', toastOptions);
      return;
    }
    setIsArchiving(true);
    try {
      const response = await fetch('/api/v1/repositories/' + repositoryName + '/archive', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      if (response.ok) {
        toast.success(
          archived
            ? `🗄️ The repository ${repositoryName} has been archived.`
            : `📤 The repository ${repositoryName} has been unarchived.`,
          toastOptions
        );
        await mutate('/api/v1/repositories');
        router.replace('/');
      } else {
        const errorMessage = await response.json();
        toast.error(
          `An error has occurred : ${errorMessage.message?.stderr ?? errorMessage.message}`,
          toastOptions
        );
      }
    } catch (error) {
      toast.error('An error has occurred', toastOptions);
    } finally {
      setIsArchiving(false);
      setArchiveDialog(false);
    }
  };

  return {
    // Delete
    deleteDialog,
    isDeleting,
    openDeleteDialog: () => setDeleteDialog(true),
    closeDeleteDialog: () => setDeleteDialog(false),
    confirmDelete,
    // Break lock
    breakLockDialog,
    isBreakingLock,
    openBreakLockDialog: () => setBreakLockDialog(true),
    closeBreakLockDialog: () => setBreakLockDialog(false),
    confirmBreakLock,
    // Archive
    archiveDialog,
    isArchiving,
    openArchiveDialog: () => setArchiveDialog(true),
    closeArchiveDialog: () => setArchiveDialog(false),
    confirmArchive: () => setArchived(true),
    unarchive: () => setArchived(false),
  };
}
