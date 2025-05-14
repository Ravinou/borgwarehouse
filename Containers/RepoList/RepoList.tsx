import classes from './RepoList.module.css';
import React, { useState, useEffect } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { ToastContainer, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Composants
import Repo from '~/Components/Repo/Repo';
import RepoManage from '../RepoManage/RepoManage';
import ShimmerRepoList from '~/Components/UI/ShimmerRepoList/ShimmerRepoList';
import { Repository, WizardEnvType, Optional } from '~/types';

export default function RepoList() {
  ////Var
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 8000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  ////Datas
  //Write a fetcher function to wrap the native fetch function and return the result of a call to url in json format
  const fetcher = async (url: string) => await fetch(url).then((res) => res.json());
  const { data, error } = useSWR('/api/v1/repositories', fetcher);

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    //If the route is home/manage-repo/add, open the RepoAdd box.
    if (router.pathname === '/manage-repo/add') {
      setDisplayRepoAdd(!displayRepoAdd);
    }
    //If the route is home/manage-repo/edit, open the RepoAdd box.
    if (router.pathname.startsWith('/manage-repo/edit')) {
      setDisplayRepoEdit(!displayRepoEdit);
    }
    //Fetch wizardEnv to hydrate Repo components
    const fetchWizardEnv = async () => {
      try {
        const response = await fetch('/api/v1/account/wizard-env', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        const data: WizardEnvType = await response.json();
        setWizardEnv(data);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    fetchWizardEnv();
  }, []);

  ////States
  const [displayRepoAdd, setDisplayRepoAdd] = useState(false);
  const [displayRepoEdit, setDisplayRepoEdit] = useState(false);
  const [wizardEnv, setWizardEnv] = useState<Optional<WizardEnvType>>();

  ////Functions

  //Firstly, check the availability of data and condition it.
  if (!data) {
    //Force mutate after login (force a API GET on /api/v1/repositories to load repoList)
    mutate('/api/v1/repositories');
    return <ShimmerRepoList />;
  }
  if (error) {
    toast.error('An error has occurred.', toastOptions);
    return <ToastContainer />;
  }
  if (data.status == 500) {
    toast.error('API Error !', toastOptions);
    return <ToastContainer />;
  }

  //BUTTON : Display RepoManage component box for ADD
  const manageRepoAddHandler = () => {
    router.replace('/manage-repo/add');
  };

  //BUTTON : Display RepoManage component box for EDIT
  const manageRepoEditHandler = (id: number) => {
    router.replace('/manage-repo/edit/' + id);
  };

  //BUTTON : Start compacting
  const manageRepoCompactHandler = async (name: string) => {
    await fetch('/api/v1/repositories/' + name + '/compact', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    }})
    .then(async (response) => {
      if (response.ok) {
        toast.success(
          'Compacting repository ' + name + '. This might take a while.',
          toastOptions
        );
      } else {
        if (response.status == 403) {
          toast.warning(
            '🔒 The server is currently protected against compaction on append-only repositories.',
            toastOptions
          );
          return;
        }
        const errorMessage = await response.json();
        toast.error(`An error has occurred : ${errorMessage.message.stderr}`, toastOptions);
      }
    })
    .catch((error) => {
      toast.error('An error has occurred', toastOptions);
      console.log(error);
    })
  };

  //BUTTON : Close RepoManage component box (when cross is clicked)
  const closeRepoManageBoxHandler = () => {
    router.replace('/');
  };

  // UI EFFECT : Display blur when display add repo modale
  const displayBlur = () => {
    if (displayRepoAdd || displayRepoEdit) {
      return classes.containerBlur;
    } else {
      return classes.container;
    }
  };

  //Dynamic list of repositories (with a map of Repo components)
  const renderRepoList = data.repoList.map((repo: Repository) => {
    return (
      <React.Fragment key={repo.id}>
        <Repo
          key={repo.id}
          id={repo.id}
          alias={repo.alias}
          status={repo.status}
          lastSave={repo.lastSave}
          alert={repo.alert}
          repositoryName={repo.repositoryName}
          storageSize={repo.storageSize}
          storageUsed={repo.storageUsed}
          sshPublicKey={repo.sshPublicKey}
          comment={repo.comment}
          lanCommand={repo.lanCommand}
          appendOnlyMode={repo.appendOnlyMode}
          repoManageEditHandler={() => manageRepoEditHandler(repo.id)}
          repoManageCompactHandler={async () => {
            await manageRepoCompactHandler(repo.repositoryName);
          }}
          wizardEnv={wizardEnv}
        ></Repo>
      </React.Fragment>
    );
  });

  return (
    <>
      <div className={displayBlur()}>
        <div className={classes.containerAddRepo}>
          <Link
            href='/manage-repo/add'
            className={classes.newRepoButton}
            onClick={manageRepoAddHandler}
          >
            <IconPlus className={classes.plusIcon} size={24} stroke={2} />
            <span>Add a repository</span>
          </Link>
        </div>
        <div className={classes.containerRepoList}>
          <div className={classes.RepoList}>{renderRepoList}</div>
        </div>
      </div>
      {displayRepoAdd && (
        <RepoManage mode='add' repoList={data.repoList} closeHandler={closeRepoManageBoxHandler} />
      )}
      {displayRepoEdit && (
        <RepoManage mode='edit' repoList={data.repoList} closeHandler={closeRepoManageBoxHandler} />
      )}
    </>
  );
}
