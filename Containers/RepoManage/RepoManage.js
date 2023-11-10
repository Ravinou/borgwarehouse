//Lib
import classes from './RepoManage.module.css';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useForm, Controller } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import Select from 'react-select';
import Link from 'next/link';
import { IconExternalLink } from '@tabler/icons-react';

export default function RepoManage(props) {
    ////Var
    let targetRepo;
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting, isValid },
    } = useForm({ mode: 'onChange' });
    //List of possible times for alerts
    const alertOptions = [
        { value: 0, label: 'Disabled' },
        { value: 3600, label: '1 hour' },
        { value: 21600, label: '6 hours' },
        { value: 43200, label: '12 hours' },
        { value: 90000, label: '1 day' },
        { value: 172800, label: '2 days' },
        { value: 259200, label: '3 days' },
        { value: 345600, label: '4 days' },
        { value: 432000, label: '5 days' },
        { value: 518400, label: '6 days' },
        { value: 604800, label: '7 days' },
        { value: 864000, label: '10 days' },
        { value: 1209600, label: '14 days' },
        { value: 2592000, label: '30 days' },
    ];
    const toastOptions = {
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
    if (!router.query.slug && props.mode == 'edit') {
        return (
            <SpinnerDotted
                size={30}
                thickness={100}
                speed={180}
                color='rgba(109, 74, 255, 1)'
            />
        );
    } else if (props.mode == 'edit') {
        for (let element in props.repoList) {
            if (props.repoList[element].id == router.query.slug) {
                targetRepo = props.repoList[element];
            }
        }
        //If the ID does not exist > 404
        if (!targetRepo) {
            router.push('/404');
            return null;
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
            body: JSON.stringify({ toDelete: true }),
        })
            .then((response) => {
                if (response.ok) {
                    toast.success(
                        '🗑 The repository #' +
                            router.query.slug +
                            ' has been successfully deleted',
                        toastOptions
                    );
                    router.replace('/');
                } else {
                    toast.error('An error has occurred', toastOptions);
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

    //Verify that the SSH key is unique
    const isSSHKeyUnique = async (sshPublicKey) => {
        let isUnique = true;

        // Extract the first two columns of the SSH key in the form
        const publicKeyPrefix = sshPublicKey.split(' ').slice(0, 2).join(' ');

        await fetch('/api/repo', { method: 'GET' })
            .then((response) => response.json())
            .then((data) => {
                for (let element in data.repoList) {
                    // Extract the first two columns of the SSH key in the repoList
                    const repoPublicKeyPrefix = data.repoList[
                        element
                    ].sshPublicKey
                        .split(' ')
                        .slice(0, 2)
                        .join(' ');

                    if (
                        repoPublicKeyPrefix === publicKeyPrefix && // Compare the first two columns of the SSH key
                        (!targetRepo ||
                            data.repoList[element].id != targetRepo.id)
                    ) {
                        toast.error(
                            'The SSH key is already used in repository #' +
                                data.repoList[element].id +
                                '. Please use another key or delete the key from the other repository.',
                            toastOptions
                        );
                        isUnique = false;
                        break;
                    }
                }
            })
            .catch((error) => {
                console.log(error);
                toast.error('An error has occurred', toastOptions);
                isUnique = false;
            });
        return isUnique;
    };

    //Form submit Handler for ADD or EDIT a repo
    const formSubmitHandler = async (dataForm) => {
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
                size: dataForm.size,
                sshPublicKey: dataForm.sshkey,
                comment: dataForm.comment,
                alert: dataForm.alert.value,
                lanCommand: dataForm.lanCommand,
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
                        toast.success(
                            'New repository added ! 🥳',
                            toastOptions
                        );
                        router.replace('/');
                    } else {
                        const errorMessage = await response.json();
                        toast.error(
                            `An error has occurred : ${errorMessage.message}`,
                            toastOptions
                        );
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
                size: dataForm.size,
                sshPublicKey: dataForm.sshkey,
                comment: dataForm.comment,
                alert: dataForm.alert.value,
                lanCommand: dataForm.lanCommand,
            };
            await fetch('/api/repo/id/' + router.query.slug + '/edit', {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(dataEdited),
            })
                .then(async (response) => {
                    if (response.ok) {
                        toast.success(
                            'The repository #' +
                                targetRepo.id +
                                ' has been successfully edited !',
                            toastOptions
                        );
                        router.replace('/');
                    } else {
                        const errorMessage = await response.json();
                        toast.error(
                            `An error has occurred : ${errorMessage.message}`,
                            toastOptions
                        );
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
                            <IconAlertCircle
                                size={80}
                                color='red'
                                style={{ margin: 'auto' }}
                            />
                            <h1 style={{ textAlign: 'center' }}>
                                Delete the repository{' '}
                                <span
                                    style={{
                                        color: 'rgba(99, 115, 129, 0.38)',
                                    }}
                                >
                                    #{targetRepo.id}
                                </span>{' '}
                                ?
                            </h1>
                        </div>
                        <div className={classes.deleteDialogMessage}>
                            <div style={{ marginBottom: '5px' }}>
                                You are about to permanently delete the
                                repository <b>#{targetRepo.id}</b> and all the
                                backups it contains.
                            </div>
                            <div>
                                The data will not be recoverable and it will not
                                be possible to go back.
                            </div>
                        </div>
                        <div className={classes.deleteDialogButtonWrapper}>
                            {isLoading ? (
                                <SpinnerDotted
                                    size={30}
                                    thickness={150}
                                    speed={100}
                                    color='#6d4aff'
                                />
                            ) : (
                                <>
                                    <button
                                        onClick={props.closeHandler}
                                        className={classes.cancelButton}
                                    >
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
                                    #{targetRepo.id}
                                </span>
                            </h1>
                        )}
                        {props.mode == 'add' && <h1>Add a repository</h1>}
                        <form
                            className={classes.repoManageForm}
                            onSubmit={handleSubmit(formSubmitHandler)}
                        >
                            {/* ALIAS */}
                            <label htmlFor='alias'>Alias</label>
                            <input
                                className='form-control is-invalid'
                                placeholder='Alias for the repository, e.g."Server 1"'
                                type='text'
                                defaultValue={
                                    props.mode == 'edit'
                                        ? targetRepo.alias
                                        : null
                                }
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
                            {errors.alias && (
                                <span className={classes.errorMessage}>
                                    {errors.alias.message}
                                </span>
                            )}
                            {/* SSH KEY */}
                            <label htmlFor='sshkey'>SSH public key</label>
                            <textarea
                                placeholder='Public key in OpenSSH format (rsa, ed25519, ed25519-sk)'
                                type='text'
                                defaultValue={
                                    props.mode == 'edit'
                                        ? targetRepo.sshPublicKey
                                        : null
                                }
                                {...register('sshkey', {
                                    required: 'SSH public key is required.',
                                    pattern: {
                                        value: /^(ssh-ed25519 AAAAC3NzaC1lZDI1NTE5|sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29t|ssh-rsa AAAAB3NzaC1yc2)[0-9A-Za-z+/]+[=]{0,3}(\s.*)?$/,
                                        message:
                                            'Invalid public key. The SSH key needs to be in OpenSSH format (rsa, ed25519, ed25519-sk)',
                                    },
                                })}
                            />
                            {errors.sshkey && (
                                <span className={classes.errorMessage}>
                                    {errors.sshkey.message}
                                </span>
                            )}
                            {/* SIZE */}
                            <label htmlFor='size'>Storage Size (Go)</label>
                            <input
                                type='number'
                                min='1'
                                defaultValue={
                                    props.mode == 'edit'
                                        ? targetRepo.storageSize
                                        : null
                                }
                                {...register('size', {
                                    required: 'A size is required.',
                                })}
                            />
                            {errors.size && (
                                <span className={classes.errorMessage}>
                                    {errors.size.message}
                                </span>
                            )}
                            {/* COMMENT */}
                            <label htmlFor='comment'>Comment</label>
                            <textarea
                                type='text'
                                placeholder='Little comment for your repository...'
                                defaultValue={
                                    props.mode == 'edit'
                                        ? targetRepo.comment
                                        : null
                                }
                                {...register('comment', {
                                    required: false,
                                    maxLength: {
                                        value: 200,
                                        message: '200 characters maximum.',
                                    },
                                })}
                            />
                            {errors.comment && (
                                <span className={classes.errorMessage}>
                                    {errors.comment.message}
                                </span>
                            )}
                            {/* LAN COMMAND GENERATION */}
                            <div className={classes.lanCommandWrapper}>
                                <input
                                    type='checkbox'
                                    name='lanCommand'
                                    defaultChecked={
                                        props.mode == 'edit'
                                            ? targetRepo.lanCommand
                                            : false
                                    }
                                    {...register('lanCommand')}
                                />
                                <label htmlFor='lanCommand'>
                                    Generates commands for use over LAN.
                                </label>
                                <Link
                                    style={{
                                        alignSelf: 'baseline',
                                        marginLeft: '5px',
                                    }}
                                    href='https://borgwarehouse.com/docs/user-manual/repositories/#generates-commands-for-use-over-lan'
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    <IconExternalLink
                                        size={16}
                                        color='#6c737f'
                                    />
                                </Link>
                            </div>
                            {/* ALERT */}
                            <label
                                style={{ margin: '25px auto 10px auto' }}
                                htmlFor='alert'
                            >
                                Alert if there is no backup since :
                            </label>
                            <div className={classes.selectAlert}>
                                <Controller
                                    name='alert'
                                    defaultValue={
                                        props.mode == 'edit'
                                            ? alertOptions.find(
                                                  (x) =>
                                                      x.value ===
                                                      targetRepo.alert
                                              )
                                            : alertOptions[4]
                                    }
                                    control={control}
                                    render={({
                                        field: { onChange, value },
                                    }) => (
                                        <Select
                                            onChange={onChange}
                                            value={value}
                                            options={alertOptions}
                                            isSearchable={false}
                                            maxMenuHeight={150}
                                            menuPlacement='top'
                                            theme={(theme) => ({
                                                ...theme,
                                                borderRadius: '5px',
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
                                    <SpinnerDotted
                                        size={30}
                                        thickness={150}
                                        speed={100}
                                        color='#6d4aff'
                                    />
                                </div>
                            ) : (
                                <button
                                    type='submit'
                                    className='defaultButton'
                                    disabled={!isValid || isSubmitting}
                                >
                                    {props.mode == 'edit' && 'Edit'}
                                    {props.mode == 'add' && 'Add'}
                                </button>
                            )}
                        </form>
                        {props.mode == 'edit' ? (
                            <button
                                className={classes.littleDeleteButton}
                                onClick={() => setDeleteDialog(true)}
                            >
                                Delete this repository
                            </button>
                        ) : null}
                    </div>
                )}
            </div>
        </>
    );
}
