//Lib
import classes from './RepoManage.module.css';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useForm, Controller } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import Select from 'react-select';
import Link from 'next/link';
import { IconExternalLink } from '@tabler/icons-react';
import { alertOptions } from '../../types/domain/constants';
import { Repository } from '~/types/domain/config.types';
import { Optional } from '~/types';

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
  ////Var
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

  ////State
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  ////Functions
  //router.query.slug is undefined for few milliseconds on first render for a direct URL access (https://github.com/vercel/next.js/discussions/11484).
  //If I call repoManage with edit mode (props), i'm firstly waiting that router.query.slug being available before rendering.
  if (props.mode === 'edit') {
    if (!router.query.slug) {
      return <SpinnerDotted size={30} thickness={100} speed={180} color='rgba(109, 74, 255, 1)' />;
    } else if (!targetRepo) {
      router.push('/404');
    }
  }

  //Delete a repo
  const deleteHandler = async () => {
    //API Call for delete
    fetch('/api/repo/id/' + router.query.slug + '/delete', {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json',
      },
    })
      .then((response) => {
        if (response.ok) {
          toast.success(
            '🗑 The repository #' + router.query.slug + ' has been successfully deleted',
            toastOptions
          );
          router.replace('/');
        } else {
          if (response.status == 403)
            toast.warning(
              '🔒 The server is currently protected against repository deletion.',
              toastOptions
            );
          else toast.error('An error has occurred', toastOptions);
          router.replace('/');
          console.log('Fail to delete');
        }
      })
      .catch((error) => {
        toast.error('An error has occurred', toastOptions);
        router.replace('/');
        console.log(error);
      });
  };

  const isSSHKeyUnique = async (sshPublicKey: string): Promise<boolean> => {
    try {
      // Extract the first two columns of the SSH key in the form
      const publicKeyPrefix = sshPublicKey.split(' ').slice(0, 2).join(' ');

      const response = await fetch('/api/repo', { method: 'GET' });
      const data = await response.json();

      const conflictingRepo = data.repoList.find((repo: { sshPublicKey: string; id: number }) => {
        const repoPublicKeyPrefix = repo.sshPublicKey.split(' ').slice(0, 2).join(' ');
        return (
          repoPublicKeyPrefix === publicKeyPrefix && (!targetRepo || repo.id !== targetRepo.id)
        );
      });

      if (conflictingRepo) {
        toast.error(
          `The SSH key is already used in repository #${conflictingRepo.id}. Please use another key or delete the key from the other repository.`,
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
    //Loading button on submit to avoid multiple send.
    setIsLoading(true);
    //Verify that the SSH key is unique
    if (!(await isSSHKeyUnique(dataForm.sshkey))) {
      setIsLoading(false);
      return;
    }
    //ADD a repo
    if (props.mode == 'add') {
      const newRepo = {
        alias: dataForm.alias,
        storageSize: parseInt(dataForm.storageSize),
        sshPublicKey: dataForm.sshkey,
        comment: dataForm.comment,
        alert: dataForm.alert.value,
        lanCommand: dataForm.lanCommand,
        appendOnlyMode: dataForm.appendOnlyMode,
      };
      //POST API to send new repo
      await fetch('/api/repo/add', {
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
            toast.error(`An error has occurred : ${errorMessage.message}`, toastOptions);
            router.replace('/');
            console.log(`Fail to ${props.mode}`);
          }
        })
        .catch((error) => {
          toast.error('An error has occurred', toastOptions);
          router.replace('/');
          console.log(error);
        });
      //EDIT a repo
    } else if (props.mode == 'edit') {
      const dataEdited = {
        alias: dataForm.alias,
        storageSize: parseInt(dataForm.storageSize),
        sshPublicKey: dataForm.sshkey,
        comment: dataForm.comment,
        alert: dataForm.alert.value,
        lanCommand: dataForm.lanCommand,
        appendOnlyMode: dataForm.appendOnlyMode,
      };
      await fetch('/api/repo/id/' + router.query.slug + '/edit', {
        method: 'PATCH',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(dataEdited),
      })
        .then(async (response) => {
          if (response.ok) {
            toast.success(
              'The repository #' + targetRepo?.id + ' has been successfully edited !',
              toastOptions
            );
            router.replace('/');
          } else {
            const errorMessage = await response.json();
            toast.error(`An error has occurred : ${errorMessage.message}`, toastOptions);
            router.replace('/');
            console.log(`Fail to ${props.mode}`);
          }
        })
        .catch((error) => {
          toast.error('An error has occurred', toastOptions);
          router.replace('/');
          console.log(error);
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
                  #{targetRepo?.id}
                </span>{' '}
                ?
              </h1>
            </div>
            <div className={classes.deleteDialogMessage}>
              <div style={{ marginBottom: '5px' }}>
                You are about to permanently delete the repository <b>#{targetRepo?.id}</b> and all
                the backups it contains.
              </div>
              <div>The data will not be recoverable and it will not be possible to go back.</div>
            </div>
            <div className={classes.deleteDialogButtonWrapper}>
              {isLoading ? (
                <SpinnerDotted size={30} thickness={150} speed={100} color='#6d4aff' />
              ) : (
                <>
                  <button onClick={props.closeHandler} className={classes.cancelButton}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteHandler();
                      setIsLoading(true);
                    }}
                    className={classes.deleteButton}
                  >
                    Yes, delete it !
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={classes.formWrapper}>
            {props.mode == 'edit' && (
              <h1>
                Edit the repository{' '}
                <span
                  style={{
                    color: 'rgba(99, 115, 129, 0.38)',
                  }}
                >
                  #{targetRepo?.id}
                </span>
              </h1>
            )}
            {props.mode == 'add' && <h1>Add a repository</h1>}
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
                    value: 2,
                    message: '2 characters min',
                  },
                  maxLength: {
                    value: 40,
                    message: '40 characters max',
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
                  pattern: {
                    value:
                      /^(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?$/,
                    message:
                      'Invalid public key. The SSH key needs to be in OpenSSH format (rsa, ed25519, ed25519-sk)',
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
                placeholder='Little comment for your repository...'
                defaultValue={props.mode == 'edit' ? targetRepo?.comment : undefined}
                {...register('comment', {
                  required: false,
                  maxLength: {
                    value: 200,
                    message: '200 characters maximum.',
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
                <label htmlFor='lanCommand'>Generates commands for use over LAN.</label>
                <Link
                  style={{
                    alignSelf: 'baseline',
                    marginLeft: '5px',
                  }}
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
                <label htmlFor='appendOnlyMode'>Enable append-only mode.</label>
                <Link
                  style={{
                    alignSelf: 'baseline',
                    marginLeft: '5px',
                  }}
                  href='https://borgwarehouse.com/docs/user-manual/repositories/#append-only-mode'
                  rel='noreferrer'
                  target='_blank'
                >
                  <IconExternalLink size={16} color='#6c737f' />
                </Link>
              </div>
              {/* ALERT */}
              <label style={{ margin: '25px auto 10px auto' }} htmlFor='alert'>
                Alert if there is no backup since :
              </label>
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
                      maxMenuHeight={150}
                      menuPlacement='top'
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
              {isLoading ? (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  <SpinnerDotted size={30} thickness={150} speed={100} color='#6d4aff' />
                </div>
              ) : (
                <button type='submit' className='defaultButton' disabled={!isValid || isSubmitting}>
                  {props.mode == 'edit' && 'Edit'}
                  {props.mode == 'add' && 'Add'}
                </button>
              )}
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
