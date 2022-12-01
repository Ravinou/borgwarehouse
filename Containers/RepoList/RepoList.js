//Lib
import classes from './RepoList.module.css';
import { useState, useEffect, useRef } from 'react';
import { IconPlus, IconChevronDown, IconChevronUp } from '@tabler/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Composants
import Repo from '../../Components/Repo/Repo';
import RepoManage from '../RepoManage/RepoManage';
import ShimmerRepoList from '../../Components/UI/ShimmerRepoList/ShimmerRepoList';

export default function RepoList() {
    ////Var
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const toastOptions = {
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
    const fetcher = async (url) => await fetch(url).then((res) => res.json());
    const { data, error } = useSWR('/api/repo', fetcher);

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
    }, []);

    ////States
    const [displayRepoAdd, setDisplayRepoAdd] = useState(false);
    const [displayRepoEdit, setDisplayRepoEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    ////Functions

    //Firstly, check the availability of data and condition it.
    if (!data) {
        //Force mutate after login (force a API GET on /api/repo to load repoList)
        mutate('/api/repo');
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

    //BUTTON : Display or not repo details for ONE repo
    const displayDetailsForOneHandler = async (id, boolean) => {
        setIsLoading(true);
        await fetch('/api/repo/id/' + id + '/displayDetails', {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ displayDetails: boolean }),
        })
            .then((response) => {
                if (response.ok) {
                    mutate('/api/repo');
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                    toast.error('API error', toastOptions);
                }
            })
            .catch((error) => {
                console.log(error);
                setIsLoading(false);
                toast.error('API error', toastOptions);
            });
    };

    //BUTTON : Display RepoManage component box for ADD
    const manageRepoAddHandler = () => {
        setDisplayRepoAdd(!displayRepoAdd);
        //Redirect url to HOME when cross is clicked.
        router.replace('/manage-repo/add');
    };

    //BUTTON : Display RepoManage component box for EDIT
    const repoManageEditHandler = (id) => {
        router.replace('/manage-repo/edit/' + id);
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
    const renderRepoList = data.repoList.map((repo, index) => {
        return (
            <>
                <Repo
                    key={repo.id}
                    id={repo.id}
                    alias={repo.alias}
                    status={repo.status}
                    lastSave={repo.lastSave}
                    repository={repo.repository}
                    storageSize={repo.storageSize}
                    storageUsed={repo.storageUsed}
                    sshPublicKey={repo.sshPublicKey}
                    displayDetails={repo.displayDetails}
                    unixUser={repo.unixUser}
                    comment={repo.comment}
                    repoManageEditHandler={() => repoManageEditHandler(repo.id)}
                ></Repo>
                {repo.displayDetails ? (
                    <div className={classes.chevron}>
                        {isLoading ? (
                            <IconChevronUp color='#494b7a' size={28} />
                        ) : (
                            <IconChevronUp
                                color='#494b7a'
                                size={28}
                                onClick={() => {
                                    displayDetailsForOneHandler(repo.id, false);
                                    // tell all SWRs with this key to revalidate
                                    mutate('/api/repo');
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div className={classes.chevron}>
                        {isLoading ? (
                            <IconChevronDown color='#494b7a' size={28} />
                        ) : (
                            <IconChevronDown
                                color='#494b7a'
                                size={28}
                                onClick={() => {
                                    displayDetailsForOneHandler(repo.id, true);
                                    // tell all SWRs with this key to revalidate
                                    mutate('/api/repo');
                                }}
                            />
                        )}
                    </div>
                )}
            </>
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
                        <IconPlus
                            className={classes.plusIcon}
                            size={24}
                            stroke={2}
                        />
                        <span>Add a repository</span>
                    </Link>
                </div>
                <div className={classes.containerRepoList}>
                    <div className={classes.RepoList}>{renderRepoList}</div>
                </div>
            </div>
            {displayRepoAdd ? (
                <RepoManage
                    mode='add'
                    repoList={data.repoList}
                    closeHandler={closeRepoManageBoxHandler}
                />
            ) : null}
            {displayRepoEdit ? (
                <RepoManage
                    mode='edit'
                    repoList={data.repoList}
                    closeHandler={closeRepoManageBoxHandler}
                />
            ) : null}
        </>
    );
}
