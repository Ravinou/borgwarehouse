import classes from './RepoList.module.css';
import React, { useState } from 'react';
import {
  IconPlus,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconSortAscending2,
  IconSortDescending2,
  IconDatabase,
  IconX,
  IconClock,
  IconCalendarUp,
  IconCalendarDown,
  IconSortAscendingSmallBig,
  IconSortDescendingSmallBig,
  IconSortDescending2Filled,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { ToastContainer, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Repo from '~/Components/Repo/Repo';
import RepoManage from '../RepoManage/RepoManage';
import ShimmerRepoList from '~/Components/UI/ShimmerRepoList/ShimmerRepoList';
import { Repository, WizardEnvType, DateFormatEnum } from '~/types';

type SortOption =
  | 'alias-asc'
  | 'alias-desc'
  | 'status-true'
  | 'status-false'
  | 'storage-used-asc'
  | 'storage-used-desc'
  | 'last-save-asc'
  | 'last-save-desc';

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

    // Sort
    switch (sortOption) {
      case 'alias-asc':
        return repoList.sort((a, b) => a.alias.localeCompare(b.alias));
      case 'alias-desc':
        return repoList.sort((a, b) => b.alias.localeCompare(a.alias));
      case 'status-true':
        return repoList.sort((a, b) => Number(b.status) - Number(a.status));
      case 'status-false':
        return repoList.sort((a, b) => Number(a.status) - Number(b.status));
      case 'storage-used-asc':
        return repoList.sort((a, b) => {
          const aRatio = a.storageSize ? a.storageUsed / a.storageSize : 0;
          const bRatio = b.storageSize ? b.storageUsed / b.storageSize : 0;
          return aRatio - bRatio;
        });
      case 'storage-used-desc':
        return repoList.sort((a, b) => {
          const aRatio = a.storageSize ? a.storageUsed / a.storageSize : 0;
          const bRatio = b.storageSize ? b.storageUsed / b.storageSize : 0;
          return bRatio - aRatio;
        });
      case 'last-save-asc':
        return repoList.sort((a, b) => {
          const aDate = a.lastSave ? new Date(a.lastSave).getTime() : 0;
          const bDate = b.lastSave ? new Date(b.lastSave).getTime() : 0;
          return aDate - bDate;
        });
      case 'last-save-desc':
        return repoList.sort((a, b) => {
          const aDate = a.lastSave ? new Date(a.lastSave).getTime() : 0;
          const bDate = b.lastSave ? new Date(b.lastSave).getTime() : 0;
          return bDate - aDate;
        });
      default:
        return repoList;
    }
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

  const renderRepoList = getSortedRepoList().map((repo: Repository) => (
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
      repoManageEditHandler={() => manageRepoEditHandler(repo.id)}
      wizardEnv={wizardEnv}
      dateFormat={dateFormat}
    />
  ));

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
            <div className={classes.sortIcons}>
              <IconSortAscendingLetters
                className={sortOption === 'alias-asc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('alias-asc')}
                title='Alias A-Z'
              />
              <IconSortDescendingLetters
                className={sortOption === 'alias-desc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('alias-desc')}
                title='Alias Z-A'
              />
              <IconSortDescending2Filled
                className={sortOption === 'status-true' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('status-true')}
                title='Status OK → KO'
              />
              <IconSortDescending2
                className={sortOption === 'status-false' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('status-false')}
                title='Status KO → OK'
              />
              <IconCalendarDown
                className={sortOption === 'last-save-desc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('last-save-desc')}
                title='Last save (recent → old)'
              />
              <IconCalendarUp
                className={sortOption === 'last-save-asc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('last-save-asc')}
                title='Last save (old → recent)'
              />
              <IconSortAscendingSmallBig
                className={sortOption === 'storage-used-asc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('storage-used-asc')}
                title='Storage usage % low → high'
              />
              <IconSortDescendingSmallBig
                className={sortOption === 'storage-used-desc' ? classes.iconActive : classes.icon}
                onClick={() => handleSortChange('storage-used-desc')}
                title='Storage usage % high → low'
              />
            </div>
            <IconRefresh
              className={`${classes.refreshIcon} ${isRefreshing ? classes.iconSpin : ''}`}
              onClick={!isRefreshing ? handleRefresh : undefined}
              title='Manually refresh status & storage. Does not replace a scheduled cron job.'
              size={18}
            />
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
