import { IconArchive, IconPlus, IconRefresh, IconSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { ToastContainer, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSWR, { useSWRConfig } from 'swr';
import classes from './RepoList.module.css';
import SortDropdown from './SortDropdown/SortDropdown';

import Repo from '~/Components/Repo/Repo';
import ShimmerRepoList from '~/Components/UI/ShimmerRepoList/ShimmerRepoList';
import { sortRepositories, type SortOption } from '~/helpers/functions/sortRepositories';
import { DateFormatEnum, Repository, StorageTarget, WizardEnvType } from '~/types';
import RepoManage from '../RepoManage/RepoManage';

export default function RepoList() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  // Modal visibility is derived directly from the route — no state/effect needed.
  const displayRepoAdd = router.pathname === '/manage-repo/add';
  const displayRepoEdit = router.pathname.startsWith('/manage-repo/edit');

  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const savedSort = localStorage.getItem('repoSort');
    return (savedSort as SortOption) || 'alias-asc';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(
    () => localStorage.getItem('repoShowArchived') === 'true'
  );

  const toggleShowArchived = () => {
    setShowArchived((prev) => {
      const next = !prev;
      localStorage.setItem('repoShowArchived', String(next));
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState(() => {
    const savedSearch = localStorage.getItem('repoSearch');
    return savedSearch || '';
  });

  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 8000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const fetcher = async (url: string) => await fetch(url).then((res) => res.json());
  const { data, error } = useSWR('/api/v1/repositories', fetcher);
  // Cached via SWR so they survive the page remount when opening/closing the
  // add/edit modal (each route — '/', '/manage-repo/add', '/manage-repo/edit/[slug]'
  // — renders its own RepoList instance). Avoids the wizardEnv "undefined" flicker.
  const { data: wizardEnv } = useSWR<WizardEnvType>('/api/v1/account/wizard-env', fetcher);
  const { data: dateFormatData } = useSWR('/api/v1/account/date-format', fetcher);
  const dateFormat: DateFormatEnum = dateFormatData?.dateFormat ?? DateFormatEnum.LOCALE;
  const { data: storageTargetsData } = useSWR('/api/v1/storage-targets', fetcher);
  const storageTargetNames = useMemo(() => {
    const map = new Map<string, string>();
    const targets: StorageTarget[] = storageTargetsData?.storageTargets ?? [];
    targets.forEach((target) => map.set(target.path, target.name));
    return map;
  }, [storageTargetsData]);

  if (!data || !data.repoList) {
    mutate('/api/v1/repositories');
    return <ShimmerRepoList />;
  }

  if (error || data.status == 500) {
    toast.error('Error loading repositories.', toastOptions);
    return <ToastContainer />;
  }

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    localStorage.setItem('repoSort', option);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    localStorage.setItem('repoSearch', query);
  };

  const getSortedRepoList = () => {
    let repoList = [...data.repoList];

    // Filter
    if (searchQuery) {
      repoList = repoList.filter((repo) =>
        `${repo.alias} ${repo.comment} ${repo.repositoryName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return sortRepositories(repoList, sortOption);
  };

  const manageRepoAddHandler = () => router.replace('/manage-repo/add');
  const manageRepoEditHandler = (id: number) => router.replace('/manage-repo/edit/' + id);
  const closeRepoManageBoxHandler = () => router.replace('/');
  const displayBlur = () =>
    displayRepoAdd || displayRepoEdit ? classes.containerBlur : classes.container;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/repositories/refresh', { method: 'POST' });
      const result = await res.json();
      if (!res.ok && res.status !== 409) {
        toast.error(result.message ?? 'Refresh failed.', toastOptions);
      } else {
        await mutate('/api/v1/repositories');
      }
    } catch {
      toast.error('Refresh failed.', toastOptions);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderRepo = (repo: Repository) => (
    <Repo
      key={repo.id}
      id={repo.id}
      alias={repo.alias}
      status={repo.status}
      lastSave={repo.lastSave}
      alert={repo.alert}
      repositoryName={repo.repositoryName}
      storageUsed={repo.storageUsed}
      storageSize={repo.storageSize}
      sshPublicKey={repo.sshPublicKey}
      comment={repo.comment}
      icon={repo.icon}
      lanCommand={repo.lanCommand}
      appendOnlyMode={repo.appendOnlyMode}
      storageTarget={repo.storageTarget}
      storageTargetName={
        repo.storageTarget ? storageTargetNames.get(repo.storageTarget) : undefined
      }
      archived={repo.archived}
      repoManageEditHandler={() => manageRepoEditHandler(repo.id)}
      wizardEnv={wizardEnv}
      dateFormat={dateFormat}
    />
  );

  const sortedRepoList = getSortedRepoList();
  const archivedCount = data.repoList.filter((repo: Repository) => repo.archived).length;
  const effectiveShowArchived = showArchived && archivedCount > 0;
  const visibleRepoList = sortedRepoList.filter((repo: Repository) =>
    effectiveShowArchived ? repo.archived : !repo.archived
  );
  const renderRepoList = visibleRepoList.map(renderRepo);

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

        <div className={classes.toolbar}>
          <div className={classes.searchContainer}>
            <IconSearch size={15} className={classes.searchIcon} />
            <input
              type='text'
              placeholder='Alias, comment, repository name...'
              value={searchQuery}
              onChange={handleSearchChange}
              className={classes.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() =>
                  handleSearchChange({
                    target: { value: '' },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={classes.clearButton}
                title='Clear search'
              >
                <IconX size={16} stroke={2} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortDropdown sortOption={sortOption} onSortChange={handleSortChange} />
            <IconRefresh
              className={`${classes.refreshIcon} ${isRefreshing ? classes.iconSpin : ''}`}
              onClick={!isRefreshing ? handleRefresh : undefined}
              title='Manually refresh status & storage. Does not replace a scheduled cron job.'
              size={18}
            />
            {archivedCount > 0 && (
              <button
                type='button'
                className={`${classes.archivedToggleBtn} ${effectiveShowArchived ? classes.archivedToggleBtnActive : ''}`}
                onClick={toggleShowArchived}
                aria-pressed={effectiveShowArchived}
                title={
                  effectiveShowArchived
                    ? 'Back to active repositories'
                    : 'Show archived repositories'
                }
              >
                <IconArchive size={16} />
                <span>{archivedCount}</span>
              </button>
            )}
          </div>
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
