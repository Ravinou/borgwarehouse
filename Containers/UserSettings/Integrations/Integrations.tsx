//Lib
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import { v4 as uuidv4 } from 'uuid';
import timestampConverter from '../../../helpers/functions/timestampConverter';
import { IconTrash, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';

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
  } = useForm({ mode: 'onChange' });

  ////State
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [tokenList, setTokenList] = useState([]);
  const [error, setError] = useState();
  const [lastGeneratedToken, setLastGeneratedToken] = useState();
  const [deletingToken, setDeletingToken] = useState(null);
  const [permissions, setPermissions] = useState({
    create: false,
    read: false,
    update: false,
    delete: false,
  });

  const fetchTokenList = async () => {
    try {
      const response = await fetch('/api/account/tokenManager', {
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

  // Permissions handler
  const hasNoPermissionSelected = () => {
    return !Object.values(permissions).some((value) => value);
  };
  const togglePermission = (permissionType) => {
    const updatedPermissions = {
      ...permissions,
      [permissionType]: !permissions[permissionType],
    };
    setPermissions(updatedPermissions);
  };
  const resetPermissions = () => {
    setPermissions({
      create: false,
      read: false,
      update: false,
      delete: false,
    });
  };

  //Form submit Handler for ADD a new token
  const formSubmitHandler = async (data) => {
    //Remove old error
    setError();
    //Loading button on submit to avoid multiple send.
    setIsLoading(true);
    //Generate a UUIDv4
    const token = uuidv4();
    setLastGeneratedToken({ name: data.tokenName, value: token });

    // Post API to send the new token integration
    try {
      const response = await fetch('/api/account/tokenManager', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          name: data.tokenName,
          token: token,
          creation: Math.floor(Date.now() / 1000),
          expiration: null,
          permissions: permissions,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        reset();
        resetPermissions();
        toast.error(result.message, toastOptions);
        setTimeout(() => setError(), 4000);
      } else {
        reset();
        resetPermissions();
        fetchTokenList();
        setIsLoading(false);
        toast.success('🔑 Token generated !', toastOptions);
      }
    } catch (error) {
      reset();
      resetPermissions();
      setIsLoading(false);
      toast.error("Can't generate your token. Contact your administrator.", toastOptions);
      setTimeout(() => setError(), 4000);
    }
  };

  //Delete token
  const deleteTokenHandler = async (tokenName) => {
    setIsDeleteLoading(true);
    try {
      const response = await fetch('/api/account/tokenManager', {
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
        setIsDeleteLoading(false);
      } else {
        fetchTokenList();
        setIsDeleteLoading(false);
        toast.success('🗑️ Token deleted !', toastOptions);
      }
    } catch (error) {
      setIsDeleteLoading(false);
      toast.error("Can't delete your token. Contact your administrator.", toastOptions);
      setTimeout(() => setError(), 4000);
    } finally {
      setIsDeleteLoading(false);
      setDeletingToken(null);
    }
  };

  return (
    <>
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2 style={{ alignSelf: 'baseline' }}>Generate token</h2>
          <Link
            style={{ alignSelf: 'baseline', marginLeft: '5px' }}
            href='https://borgwarehouse.com/docs/developer-manual/api/'
            rel='noreferrer'
            target='_blank'
          >
            <IconExternalLink size={16} color='#6c737f' />
          </Link>
        </div>
        <div className={classes.setting}>
          <form
            onSubmit={handleSubmit(formSubmitHandler)}
            className={[classes.bwForm, classes.tokenGen].join(' ')}
          >
            <div className={classes.tokenWrapper}>
              <input
                type='text'
                autoComplete='off'
                placeholder='Token name'
                {...register('tokenName', {
                  required: true,
                  pattern: /^[a-zA-Z0-9_-]*$/,
                  maxLength: 25,
                })}
              />

              <div className={classes.permissionsWrapper}>
                <div
                  className={`${classes.permissionBadge} ${permissions.create ? classes.highlight : ''}`}
                  onClick={() => togglePermission('create')}
                >
                  Create
                </div>
                <div
                  className={`${classes.permissionBadge} ${permissions.read ? classes.highlight : ''}`}
                  onClick={() => togglePermission('read')}
                >
                  Read
                </div>
                <div
                  className={`${classes.permissionBadge} ${permissions.update ? classes.highlight : ''}`}
                  onClick={() => togglePermission('update')}
                >
                  Update
                </div>
                <div
                  className={`${classes.permissionBadge} ${permissions.delete ? classes.highlight : ''}`}
                  onClick={() => togglePermission('delete')}
                >
                  Delete
                </div>
              </div>
            </div>

            <button
              className={classes.AccountSettingsButton}
              disabled={!isValid || isSubmitting || hasNoPermissionSelected()}
            >
              {isLoading ? (
                <SpinnerDotted size={15} thickness={150} speed={100} color='#fff' />
              ) : (
                'Generate'
              )}
            </button>
          </form>
          {errors.tokenName && errors.tokenName.type === 'maxLength' && (
            <small className={classes.errorMessage}>25 characters max.</small>
          )}
          {errors.tokenName && errors.tokenName.type === 'pattern' && (
            <small className={classes.errorMessage}>
              Only alphanumeric characters, dashes, and underscores are allowed (no spaces).
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
                <div key={index} className={classes.tokenCardWrapper}>
                  <div
                    className={`${classes.tokenCard} ${
                      lastGeneratedToken && lastGeneratedToken.name === token.name
                        ? classes.tokenCardHighlight
                        : ''
                    } ${deletingToken && deletingToken.name === token.name ? classes.tokenCardBlurred : ''}`}
                  >
                    <div className={classes.tokenCardHeader}>{token.name}</div>
                    <div className={classes.tokenCardBody}>
                      <p>
                        <strong>Created at:</strong>
                        {timestampConverter(token.creation)}
                      </p>
                      <p>
                        <strong>Permission:</strong>
                        <div className={classes.permissionBadges}>
                          {Object.keys(token.permissions).map((permission) =>
                            token.permissions[permission] ? (
                              <div key={permission} className={classes.permissionBadge}>
                                {permission.charAt(0).toUpperCase() + permission.slice(1)}
                              </div>
                            ) : null
                          )}
                        </div>
                      </p>
                      {lastGeneratedToken && lastGeneratedToken.name === token.name && (
                        <>
                          <p>
                            <strong>Token:</strong>
                            <CopyButton
                              size={22}
                              displayIconConfirmation={true}
                              dataToCopy={lastGeneratedToken.value}
                            >
                              <span>{lastGeneratedToken.value}</span>
                            </CopyButton>
                          </p>
                          <Info color='#3498db'>
                            This token will not be shown again. Please save it.
                          </Info>
                        </>
                      )}
                      {deletingToken && deletingToken.name === token.name && (
                        <div className={classes.deleteConfirmationButtons}>
                          <button
                            className={classes.confirmButton}
                            onClick={() => deleteTokenHandler(token.name)}
                            disabled={isDeleteLoading}
                          >
                            Confirm
                            {isDeleteLoading && (
                              <SpinnerDotted size={15} thickness={150} speed={100} color='#fff' />
                            )}{' '}
                          </button>
                          {!isDeleteLoading && (
                            <button
                              className={classes.cancelButton}
                              onClick={() => setDeletingToken(null)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={classes.deleteToken}>
                    <IconTrash
                      cursor={'pointer'}
                      color='#ea1313'
                      strokeWidth={2}
                      onClick={() => setDeletingToken(token)}
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
