import {
  IconArchive,
  IconAlertCircle,
  IconExternalLink,
  IconLockOpen,
  IconX,
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import { bwSelectStyles, bwSelectTheme } from '~/Components/UI/Select/bwSelectStyles';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSWRConfig } from 'swr';
import { useLoader } from '~/contexts/LoaderContext';
import { alertOptions, Optional, Repository, StorageTarget } from '~/types';
import { DEFAULT_REPO_ICON } from '~/Components/Repo/repoIcons';
import ConfirmDialog, { DialogHighlight } from './ConfirmDialog';
import RepoActionsFooter from './RepoActionsFooter';
import { useRepoActions } from './useRepoActions';
import classes from './RepoManage.module.css';

// Lazy-loaded: the curated icon grid only ships when the add/edit form is opened.
const IconPicker = dynamic(() => import('~/Components/Repo/IconPicker/IconPicker'), {
  ssr: false,
});

type RepoManageProps = {
  mode: 'add' | 'edit';
  repoList: Optional<Array<Repository>>;
  closeHandler: () => void;
};

type DataForm = {
  alias: string;
  storageSize: string;
  sshkey: string;
  comment: string;
  alert: { value: Optional<number>; label: string };
  lanCommand: boolean;
  appendOnlyMode: boolean;
};

export default function RepoManage(props: RepoManageProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const targetRepo =
    props.mode === 'edit' && router.query.slug
      ? props.repoList?.find((repo) => repo.id.toString() === router.query.slug)
      : undefined;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DataForm>({ mode: 'onChange' });

  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const [isLoading, setIsLoading] = useState(false);
  const isArchived = !!targetRepo?.archived;
  const actions = useRepoActions(targetRepo);
  const [icon, setIcon] = useState<string>(
    (props.mode === 'edit' ? targetRepo?.icon : undefined) ?? DEFAULT_REPO_ICON
  );
  const [storageTargets, setStorageTargets] = useState<StorageTarget[]>([]);
  const [storageTarget, setStorageTarget] = useState<string>('');
  const { start, stop } = useLoader();

  // Load the list of storage targets (STORAGE_TARGETS env, with their UI aliases)
  // for the "Storage location" selector (add mode) and to resolve the display
  // name of the current target (edit mode).
  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/storage-targets', { method: 'GET' })
      .then(async (response) => {
        if (!response.ok) return;
        const data: { storageTargets?: StorageTarget[] } = await response.json();
        if (isMounted && Array.isArray(data.storageTargets)) {
          setStorageTargets(data.storageTargets);
        }
      })
      .catch(() => {
        /* silently ignore: the selector simply stays on "Local" */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  //router.query.slug is undefined for few milliseconds on first render for a direct URL access (https://github.com/vercel/next.js/discussions/11484).
  //If I call repoManage with edit mode (props), i'm firstly waiting that router.query.slug being available before rendering.
  if (props.mode === 'edit') {
    if (!router.query.slug) {
      start();
      return;
    } else if (!targetRepo) {
      stop();
      router.push('/404');
    }
  }

  const isSSHKeyUnique = async (sshPublicKey: string): Promise<boolean> => {
    try {
      // Extract the first two columns of the SSH key in the form
      const publicKeyPrefix = sshPublicKey.split(' ').slice(0, 2).join(' ');

      const response = await fetch('/api/v1/repositories', { method: 'GET' });
      const data: { repoList: Repository[] } = await response.json();

      const conflictingRepo = data.repoList.find((repo: { sshPublicKey: string; id: number }) => {
        const repoPublicKeyPrefix = repo.sshPublicKey.split(' ').slice(0, 2).join(' ');
        return (
          repoPublicKeyPrefix === publicKeyPrefix && (!targetRepo || repo.id !== targetRepo.id)
        );
      });

      if (conflictingRepo) {
        toast.error(
          `The SSH key is already used in repository ${conflictingRepo.repositoryName}. Please use another key or delete the key from the other repository.`,
          toastOptions
        );
        return false;
      }

      return true;
    } catch (error) {
      console.log(error);
      toast.error('An error has occurred', toastOptions);
      return false;
    }
  };

  //Form submit Handler for ADD or EDIT a repo
  const formSubmitHandler = async (dataForm: DataForm) => {
    setIsLoading(true);
    start();

    // Clean SSH key by removing leading/trailing whitespace and line breaks
    const cleanedSSHKey = dataForm.sshkey.trim();

    //Verify that the SSH key is unique
    if (!(await isSSHKeyUnique(cleanedSSHKey))) {
      stop();
      setIsLoading(false);
      return;
    }
    //ADD a repo
    if (props.mode == 'add') {
      const newRepo = {
        alias: dataForm.alias,
        storageSize: parseInt(dataForm.storageSize),
        sshPublicKey: cleanedSSHKey,
        comment: dataForm.comment,
        alert: dataForm.alert.value,
        lanCommand: dataForm.lanCommand,
        appendOnlyMode: dataForm.appendOnlyMode,
        icon: icon,
        storageTarget: storageTarget || undefined,
      };
      //POST API to send new repo
      await fetch('/api/v1/repositories', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(newRepo),
      })
        .then(async (response) => {
          if (response.ok) {
            toast.success('New repository added ! 🥳', toastOptions);
            await mutate('/api/v1/repositories');
            router.replace('/');
          } else {
            const errorMessage = await response.json();
            toast.error(`An error has occurred : ${errorMessage.message.stderr}`, toastOptions);
            router.replace('/');
            console.log(`Fail to ${props.mode}`);
          }
        })
        .catch((error) => {
          toast.error('An error has occurred', toastOptions);
          router.replace('/');
          console.log(error);
        })
        .finally(() => {
          stop();
          setIsLoading(false);
        });
      //EDIT a repo
    } else if (props.mode == 'edit') {
      const dataEdited = {
        alias: dataForm.alias,
        storageSize: parseInt(dataForm.storageSize),
        sshPublicKey: cleanedSSHKey,
        comment: dataForm.comment,
        alert: dataForm.alert.value,
        lanCommand: dataForm.lanCommand,
        appendOnlyMode: dataForm.appendOnlyMode,
        icon: icon,
      };
      await fetch('/api/v1/repositories/' + targetRepo?.repositoryName, {
        method: 'PATCH',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(dataEdited),
      })
        .then(async (response) => {
          if (response.ok) {
            toast.success(
              'The repository ' + targetRepo?.repositoryName + ' has been successfully edited !',
              toastOptions
            );
            await mutate('/api/v1/repositories');
            router.replace('/');
          } else {
            const errorMessage = await response.json();
            toast.error(`An error has occurred : ${errorMessage.message.stderr}`, toastOptions);
            router.replace('/');
            console.log(`Fail to ${props.mode}`);
          }
        })
        .catch((error) => {
          toast.error('An error has occurred', toastOptions);
          router.replace('/');
          console.log(error);
        })
        .finally(() => {
          stop();
          setIsLoading(false);
        });
    }
  };

  return (
    <>
      <div className={classes.modaleWrapper} />
      <div className={classes.modale}>
        <div onClick={props.closeHandler} className={classes.close}>
          <IconX size={20} />
        </div>
        {actions.deleteDialog ? (
          <ConfirmDialog
            variant='danger'
            icon={<IconAlertCircle size={40} />}
            title={
              <>
                Delete the repository{' '}
                <DialogHighlight>{targetRepo?.repositoryName}</DialogHighlight> ?
              </>
            }
            confirmLabel='Yes, delete it !'
            isBusy={actions.isDeleting}
            onCancel={actions.closeDeleteDialog}
            onConfirm={actions.confirmDelete}
          >
            <div style={{ marginBottom: '5px' }}>
              You are about to permanently delete the repository <b>{targetRepo?.repositoryName}</b>{' '}
              and all the backups it contains.
            </div>
            <div>The data will not be recoverable and it will not be possible to go back.</div>
          </ConfirmDialog>
        ) : actions.breakLockDialog ? (
          <ConfirmDialog
            variant='warning'
            icon={<IconLockOpen size={40} />}
            title={
              <>
                Break the lock on <DialogHighlight>{targetRepo?.repositoryName}</DialogHighlight> ?
              </>
            }
            confirmLabel='Break the lock'
            busyLabel='Releasing…'
            isBusy={actions.isBreakingLock}
            onCancel={actions.closeBreakLockDialog}
            onConfirm={actions.confirmBreakLock}
          >
            <div style={{ marginBottom: '5px' }}>
              This releases a stale lock left by an interrupted operation (e.g. a container restart
              during a compaction).
            </div>
            <div>
              Only do this if backups fail with a lock error and{' '}
              <b>no backup or compaction is currently running</b> on this repository.
            </div>
          </ConfirmDialog>
        ) : actions.archiveDialog ? (
          <ConfirmDialog
            variant='warning'
            icon={<IconArchive size={40} />}
            title={
              <>
                Archive <DialogHighlight>{targetRepo?.repositoryName}</DialogHighlight> ?
              </>
            }
            confirmLabel='Archive it'
            busyLabel='Archiving…'
            isBusy={actions.isArchiving}
            onCancel={actions.closeArchiveDialog}
            onConfirm={actions.confirmArchive}
          >
            <div style={{ marginBottom: '5px' }}>
              Archiving <b>freezes</b> this repository: the client can no longer connect (no backup,
              prune or restore) and it stops triggering notifications.
            </div>
            <div>
              The data is kept untouched and this is <b>fully reversible</b>. You can simply
              unarchive the repository at any time to resume normal operations.
            </div>
          </ConfirmDialog>
        ) : (
          <div className={classes.formWrapper}>
            {props.mode == 'edit' && (
              <h2>
                Edit the repository{' '}
                <span
                  style={{
                    color: '#6d4aff',
                  }}
                >
                  {targetRepo?.repositoryName}
                </span>
              </h2>
            )}
            {props.mode == 'add' && <h2>Add a repository</h2>}
            {isArchived && (
              <div className={classes.archivedBanner}>
                <IconArchive size={18} />
                <span>
                  This repository is <b>archived</b> and frozen. Unarchive it below to make changes.
                </span>
              </div>
            )}
            <form className={classes.repoManageForm} onSubmit={handleSubmit(formSubmitHandler)}>
              <fieldset
                disabled={isArchived}
                className={`${classes.formFieldset} ${isArchived ? classes.formFieldsetArchived : ''}`}
              >
                {/* ALIAS */}
                <label htmlFor='alias'>Alias</label>
                <input
                  className='form-control is-invalid'
                  placeholder='Alias for the repository, e.g."Server 1"'
                  type='text'
                  defaultValue={props.mode == 'edit' ? targetRepo?.alias : undefined}
                  {...register('alias', {
                    required: 'An alias is required.',
                    minLength: {
                      value: 1,
                      message: '1 character min',
                    },
                    maxLength: {
                      value: 100,
                      message: '100 characters max',
                    },
                  })}
                />
                {errors.alias && (
                  <span className={classes.errorMessage}>{errors.alias.message}</span>
                )}
                {/* ICON */}
                <label>Icon</label>
                <IconPicker value={icon} onChange={setIcon} />
                {/* SSH KEY */}
                <label htmlFor='sshkey'>SSH public key</label>
                <textarea
                  placeholder='Public key in OpenSSH format (rsa, ed25519, ed25519-sk)'
                  defaultValue={props.mode == 'edit' ? targetRepo?.sshPublicKey : undefined}
                  {...register('sshkey', {
                    required: 'SSH public key is required.',
                    validate: (value) => {
                      const trimmedValue = value.trim();
                      const pattern =
                        /^(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?$/;
                      return (
                        pattern.test(trimmedValue) ||
                        'Invalid public key. The key needs to be in OpenSSH format (rsa, ed25519, ed25519-sk)'
                      );
                    },
                  })}
                />
                {errors.sshkey && (
                  <span className={classes.errorMessage}>{errors.sshkey.message}</span>
                )}
                {/* storageSize */}
                <label htmlFor='storageSize'>Storage Size (GB)</label>
                <input
                  type='number'
                  placeholder='1000'
                  min='1'
                  defaultValue={props.mode == 'edit' ? targetRepo?.storageSize : undefined}
                  {...register('storageSize', {
                    required: 'A storage size is required.',
                  })}
                />
                {errors.storageSize && (
                  <span className={classes.errorMessage}>{errors.storageSize.message}</span>
                )}
                {/* STORAGE LOCATION (external storage targets) */}
                {props.mode == 'add' && storageTargets.length > 0 && (
                  <>
                    <label htmlFor='storageTarget'>Storage location</label>
                    <Select
                      inputId='storageTarget'
                      isSearchable={false}
                      maxMenuHeight={300}
                      styles={bwSelectStyles}
                      theme={bwSelectTheme}
                      defaultValue={{ value: '', label: 'Local (default)' }}
                      options={[
                        { value: '', label: 'Local (default)' },
                        ...storageTargets.map((target) => ({
                          value: target.path,
                          label: target.name,
                        })),
                      ]}
                      onChange={(option) => setStorageTarget(option?.value ?? '')}
                    />
                  </>
                )}
                {/* STORAGE LOCATION (read-only in edit mode: not changeable after creation) */}
                {props.mode == 'edit' && (
                  <>
                    <label htmlFor='storageTargetReadOnly'>Storage location</label>
                    <input
                      id='storageTargetReadOnly'
                      type='text'
                      readOnly
                      disabled
                      value={
                        targetRepo?.storageTarget
                          ? (storageTargets.find((t) => t.path === targetRepo.storageTarget)
                              ?.name ?? targetRepo.storageTarget)
                          : 'Local (default)'
                      }
                      title='The storage location cannot be changed after creation.'
                    />
                  </>
                )}
                {/* COMMENT */}
                <label htmlFor='comment'>Comment</label>
                <textarea
                  defaultValue={props.mode == 'edit' ? targetRepo?.comment : undefined}
                  {...register('comment', {
                    required: false,
                    maxLength: {
                      value: 500,
                      message: '500 characters maximum.',
                    },
                  })}
                />
                {errors.comment && (
                  <span className={classes.errorMessage}>{errors.comment.message}</span>
                )}
                {/* LAN COMMAND GENERATION */}
                <div className={classes.optionCommandWrapper}>
                  <input
                    type='checkbox'
                    defaultChecked={props.mode == 'edit' ? targetRepo?.lanCommand : false}
                    {...register('lanCommand')}
                  />
                  <label htmlFor='lanCommand'>Generates commands for use over LAN</label>
                  <Link
                    href='https://borgwarehouse.com/docs/user-manual/repositories/#generates-commands-for-use-over-lan'
                    rel='noreferrer'
                    target='_blank'
                  >
                    <IconExternalLink size={16} color='#6c737f' />
                  </Link>
                </div>
                {/* APPEND-ONLY MODE */}
                <div className={classes.optionCommandWrapper}>
                  <input
                    type='checkbox'
                    defaultChecked={props.mode == 'edit' ? targetRepo?.appendOnlyMode : false}
                    {...register('appendOnlyMode')}
                  />
                  <label htmlFor='appendOnlyMode'>Enable append-only mode</label>
                  <Link
                    href='https://borgwarehouse.com/docs/user-manual/repositories/#append-only-mode'
                    rel='noreferrer'
                    target='_blank'
                  >
                    <IconExternalLink size={16} color='#6c737f' />
                  </Link>
                </div>
                {/* ALERT */}
                <div className={classes.selectAlertWrapper}>
                  <label htmlFor='alert'>Alert if there is no backup since :</label>
                  <div className={classes.selectAlert}>
                    <Controller
                      name='alert'
                      defaultValue={
                        props.mode == 'edit'
                          ? alertOptions.find((x) => x.value === targetRepo?.alert) || {
                              value: targetRepo?.alert,
                              label: `Custom value (${targetRepo?.alert} seconds)`,
                            }
                          : alertOptions[4]
                      }
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          onChange={onChange}
                          value={value}
                          options={alertOptions}
                          isSearchable={false}
                          maxMenuHeight={300}
                          menuPlacement='top'
                          styles={bwSelectStyles}
                          theme={bwSelectTheme}
                        />
                      )}
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  className='defaultButton'
                  disabled={!isValid || isSubmitting || isLoading}
                >
                  {props.mode == 'edit' && 'Save'}
                  {props.mode == 'add' && 'Add repository'}
                </button>
              </fieldset>
            </form>
            {props.mode == 'edit' ? (
              <RepoActionsFooter
                isArchived={isArchived}
                isArchiving={actions.isArchiving}
                onBreakLock={actions.openBreakLockDialog}
                onArchive={actions.openArchiveDialog}
                onUnarchive={actions.unarchive}
                onDelete={actions.openDeleteDialog}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
