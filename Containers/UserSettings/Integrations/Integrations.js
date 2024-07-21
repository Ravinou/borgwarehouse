//Lib
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import { v4 as uuidv4 } from 'uuid';
import timestampConverter from '../../../helpers/functions/timestampConverter';
import { IconTrash } from '@tabler/icons-react';

//Components
import Error from '../../../Components/UI/Error/Error';
import CopyButton from '../../../Components/UI/CopyButton/CopyButton';
import Info from '../../../Components/UI/Info/Info';

export default function Integrations() {
    //Var
    const toastOptions = {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm({ mode: 'onChange', defaultValues: { authorization: 'read' } });

    ////State
    const [isLoading, setIsLoading] = useState(false);
    const [tokenList, setTokenList] = useState([]);
    const [error, setError] = useState();
    const [lastGeneratedToken, setLastGeneratedToken] = useState();
    const [deletingToken, setDeletingToken] = useState(null);

    const fetchTokenList = async () => {
        try {
            const response = await fetch('/api/account/token-manager', {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                },
            });
            const tokensArray = await response.json();
            setTokenList(tokensArray);
        } catch (error) {
            console.log('Fetching token list failed.');
        }
    };

    ////LifeCycle
    useEffect(() => {
        fetchTokenList();
    }, []);

    //Form submit Handler for ADD a repo
    const formSubmitHandler = async (data) => {
        //Remove old error
        setError();
        //Loading button on submit to avoid multiple send.
        setIsLoading(true);
        console.log(data);
        //Generate a UUIDv4
        const token = uuidv4();
        setLastGeneratedToken({ name: data.tokenName, value: token });

        // Post API to send the new token integration
        try {
            const response = await fetch('/api/account/token-manager', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.tokenName,
                    token: token,
                    creation: Math.floor(Date.now() / 1000),
                    expirition: null,
                    permissions: {
                        read: true,
                        write: data.authorization === 'write' ? true : false,
                    },
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                setIsLoading(false);
                reset();
                toast.error(result.message, toastOptions);
                setTimeout(() => setError(), 4000);
            } else {
                reset();
                fetchTokenList();
                setIsLoading(false);
                toast.success('🔑 Token generated !', toastOptions);
            }
        } catch (error) {
            reset();
            setIsLoading(false);
            console.log(error);
            toast.error(
                "Can't generate your token. Contact your administrator.",
                toastOptions
            );
            setTimeout(() => setError(), 4000);
        }
    };

    //Delete token
    const deleteTokenHandler = async (tokenName) => {
        try {
            const response = await fetch('/api/account/token-manager', {
                method: 'DELETE',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({
                    name: tokenName,
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                toast.error(result.message, toastOptions);
                setTimeout(() => setError(), 4000);
            } else {
                fetchTokenList();
                toast.success('🗑️ Token deleted !', toastOptions);
            }
        } catch (error) {
            setIsLoading(false);
            toast.error(
                "Can't delete your token. Contact your administrator.",
                toastOptions
            );
            setTimeout(() => setError(), 4000);
        } finally {
            setDeletingToken(null);
        }
    };

    return (
        <>
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Generate token</h2>
                </div>
                <div className={classes.setting}>
                    <form
                        onSubmit={handleSubmit(formSubmitHandler)}
                        className={[classes.bwForm, classes.tokenGen].join(' ')}
                    >
                        <input
                            type='text'
                            placeholder='Token name'
                            {...register('tokenName', {
                                required: true,
                                pattern: /^[a-zA-Z0-9_-]*$/,
                                maxLength: 25,
                            })}
                        />

                        <div className='radio-group'>
                            <label style={{ marginRight: '10px' }}>
                                <div style={{ display: 'flex' }}>
                                    <input
                                        {...register('authorization')}
                                        type='radio'
                                        value='read'
                                    />
                                    <span>Read</span>
                                </div>
                            </label>
                            <label>
                                <div style={{ display: 'flex' }}>
                                    <input
                                        {...register('authorization')}
                                        type='radio'
                                        value='write'
                                    />
                                    <span>Write</span>
                                </div>
                            </label>
                        </div>

                        <button
                            className={classes.AccountSettingsButton}
                            disabled={!isValid || isSubmitting}
                        >
                            {isLoading ? (
                                <SpinnerDotted
                                    size={20}
                                    thickness={150}
                                    speed={100}
                                    color='#fff'
                                />
                            ) : (
                                'Generate'
                            )}
                        </button>
                    </form>
                    {errors.tokenName &&
                        errors.tokenName.type === 'maxLength' && (
                            <small className={classes.errorMessage}>
                                25 characters max.
                            </small>
                        )}
                    {errors.tokenName &&
                        errors.tokenName.type === 'pattern' && (
                            <small className={classes.errorMessage}>
                                Only alphanumeric characters, dashes, and
                                underscores are allowed (no spaces).
                            </small>
                        )}
                    {error && <Error message={error} />}
                </div>
            </div>
            {tokenList && tokenList.length > 0 && (
                <div className={classes.containerSetting}>
                    <div className={classes.settingCategory}>
                        <h2>API Tokens</h2>
                    </div>
                    <div className={classes.tokenCardList}>
                        {tokenList
                            .slice()
                            .sort((a, b) => b.creation - a.creation)
                            .map((token, index) => (
                                <div
                                    key={index}
                                    className={classes.tokenCardWrapper}
                                >
                                    <div
                                        className={`${classes.tokenCard} ${
                                            lastGeneratedToken &&
                                            lastGeneratedToken.name ===
                                                token.name
                                                ? classes.tokenCardHighlight
                                                : ''
                                        } ${
                                            deletingToken &&
                                            deletingToken.name === token.name
                                                ? classes.tokenCardBlurred
                                                : ''
                                        }`}
                                    >
                                        <div
                                            className={classes.tokenCardHeader}
                                        >
                                            {token.name}
                                        </div>
                                        <div className={classes.tokenCardBody}>
                                            <p>
                                                <strong>Created at:</strong>
                                                {timestampConverter(
                                                    token.creation
                                                )}
                                            </p>
                                            <p>
                                                <strong>Permission:</strong>
                                                <div
                                                    className={
                                                        classes.permissionBadge
                                                    }
                                                >
                                                    {token.permissions.write
                                                        ? 'Write'
                                                        : 'Read'}
                                                </div>
                                            </p>
                                            {lastGeneratedToken &&
                                                lastGeneratedToken.name ===
                                                    token.name && (
                                                    <>
                                                        <p>
                                                            <strong>
                                                                Token:
                                                            </strong>
                                                            <CopyButton
                                                                size={22}
                                                                displayIconConfirmation={
                                                                    true
                                                                }
                                                                dataToCopy={
                                                                    lastGeneratedToken.value
                                                                }
                                                            >
                                                                <span>
                                                                    {
                                                                        lastGeneratedToken.value
                                                                    }
                                                                </span>
                                                            </CopyButton>
                                                        </p>
                                                        <Info color='#3498db'>
                                                            This token will not
                                                            be shown again.
                                                            Please save it.
                                                        </Info>
                                                    </>
                                                )}
                                            {deletingToken &&
                                                deletingToken.name ===
                                                    token.name && (
                                                    <div
                                                        className={
                                                            classes.deleteConfirmationButtons
                                                        }
                                                    >
                                                        <button
                                                            className={
                                                                classes.confirmButton
                                                            }
                                                            onClick={() =>
                                                                deleteTokenHandler(
                                                                    token.name
                                                                )
                                                            }
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            className={
                                                                classes.cancelButton
                                                            }
                                                            onClick={() =>
                                                                setDeletingToken(
                                                                    null
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                    <div className={classes.deleteToken}>
                                        <IconTrash
                                            cursor={'pointer'}
                                            color='#ea1313'
                                            strokeWidth={2}
                                            onClick={() =>
                                                setDeletingToken(token)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </>
    );
}