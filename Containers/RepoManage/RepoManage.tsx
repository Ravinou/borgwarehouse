import { IconAlertCircle, IconExternalLink, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from '~/contexts/LoaderContext';
import { alertOptions, Optional, Repository } from '~/types';
import classes from './RepoManage.module.css';

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

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { start, stop } = useLoader();

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

  //Delete a repo
  const deleteHandler = async (repositoryName?: string) => {
    start();
    if (!repositoryName) {
      stop();
      toast.error('Repository name not found', toastOptions);
      router.replace('/');
      return;
    }
    //API Call for delete
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
          router.replace('/');
        } else {
          if (response.status == 403) {
            toast.warning(
              '🔒 The server is currently protected against repository deletion.',
              toastOptions
            );
            setIsLoading(false);
            router.replace('/');
          } else {
            const errorMessage = await response.json();
            toast.error(`An error has occurred : ${errorMessage.message.stderr}`, toastOptions);
            router.replace('/');
            console.log('Fail to delete');
          }
        }
      })
      .catch((error) => {
        toast.error('An error has occurred', toastOptions);
        router.replace('/');
        console.log(error);
      })
      .finally(() => {
        stop();
      });
  };

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
          <IconX size={36} />
        </div>
        {deleteDialog ? (
          <div className={classes.deleteDialogWrapper}>
            <div>
              <IconAlertCircle size={80} color='red' style={{ margin: 'auto' }} />
              <h1 style={{ textAlign: 'center' }}>
                Delete the repository{' '}
                <span
                  style={{
                    color: 'rgba(99, 115, 129, 0.38)',
                  }}
                >
                  {targetRepo?.repositoryName}
                </span>{' '}
                ?
              </h1>
            </div>
            <div className={classes.deleteDialogMessage}>
              <div style={{ marginBottom: '5px' }}>
                You are about to permanently delete the repository{' '}
                <b>{targetRepo?.repositoryName}</b> and all the backups it contains.
              </div>
              <div>The data will not be recoverable and it will not be possible to go back.</div>
            </div>
            <div className={classes.deleteDialogButtonWrapper}>
              <>
                <button
                  onClick={props.closeHandler}
                  disabled={isLoading}
                  className={classes.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteHandler(targetRepo?.repositoryName);
                    setIsLoading(true);
                  }}
                  className={classes.deleteButton}
                >
                  Yes, delete it !
                </button>
              </>
            </div>
          </div>
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
            <form className={classes.repoManageForm} onSubmit={handleSubmit(formSubmitHandler)}>
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
              {errors.alias && <span className={classes.errorMessage}>{errors.alias.message}</span>}
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
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '35px',
                            height: '35px',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            padding: '0 8px',
                          }),
                          input: (base) => ({
                            ...base,
                            margin: 0,
                          }),
                          indicatorsContainer: (base) => ({
                            ...base,
                            height: '35px',
                          }),
                        }}
                        theme={(theme) => ({
                          ...theme,
                          borderRadius: 5,
                          colors: {
                            ...theme.colors,
                            primary25: '#c3b6fa',
                            primary: '#6d4aff',
                          },
                        })}
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
            </form>
            {props.mode == 'edit' ? (
              <button className={classes.littleDeleteButton} onClick={() => setDeleteDialog(true)}>
                Delete this repository
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
