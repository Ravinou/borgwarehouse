import { describe, expect, it } from 'vitest';

import type { Repository } from '~/types';
import { sortRepositories, type SortOption } from './sortRepositories';

const repoList: Repository[] = [
  {
    id: 1,
    alias: 'Bravo',
    repositoryName: 'repo-1',
    status: true,
    lastSave: 1000,
    storageSize: 200,
    storageUsed: 50,
    sshPublicKey: 'ssh-rsa AAAA',
    comment: 'first',
    appendOnlyMode: false,
  },
  {
    id: 2,
    alias: 'Alpha',
    repositoryName: 'repo-2',
    status: false,
    lastSave: 500,
    storageSize: 200,
    storageUsed: 150,
    sshPublicKey: 'ssh-rsa BBBB',
    comment: 'second',
    appendOnlyMode: true,
  },
  {
    id: 3,
    alias: 'Charlie',
    repositoryName: 'repo-3',
    status: true,
    lastSave: 1500,
    storageSize: 300,
    storageUsed: 90,
    sshPublicKey: 'ssh-rsa CCCC',
    comment: 'third',
    appendOnlyMode: false,
  },
];

describe('sortRepositories', () => {
  it('sorts by alias A -> Z', () => {
    const sorted = sortRepositories(repoList, 'alias-asc');
    expect(sorted.map((repo) => repo.id)).toEqual([2, 1, 3]);
  });

  it('sorts by alias Z -> A', () => {
    const sorted = sortRepositories(repoList, 'alias-desc');
    expect(sorted.map((repo) => repo.id)).toEqual([3, 1, 2]);
  });

  it('sorts status OK repositories first', () => {
    const sorted = sortRepositories(repoList, 'status-true');
    expect(sorted.map((repo) => repo.id)).toEqual([1, 3, 2]);
  });

  it('sorts status KO repositories first', () => {
    const sorted = sortRepositories(repoList, 'status-false');
    expect(sorted.map((repo) => repo.id)).toEqual([2, 1, 3]);
  });

  it('sorts append-only repositories first when enabled sort is selected', () => {
    const sorted = sortRepositories(repoList, 'append-only-true');
    expect(sorted.map((repo) => repo.id)).toEqual([2, 1, 3]);
  });

  it('sorts non-append-only repositories first when disabled sort is selected', () => {
    const sorted = sortRepositories(repoList, 'append-only-false');
    expect(sorted.map((repo) => repo.id)).toEqual([1, 3, 2]);
  });

  it('sorts by storage usage ratio low -> high', () => {
    const sorted = sortRepositories(repoList, 'storage-used-asc');
    expect(sorted.map((repo) => repo.id)).toEqual([1, 3, 2]);
  });

  it('sorts by storage usage ratio high -> low', () => {
    const sorted = sortRepositories(repoList, 'storage-used-desc');
    expect(sorted.map((repo) => repo.id)).toEqual([2, 3, 1]);
  });

  it('sorts by last save old -> recent', () => {
    const sorted = sortRepositories(repoList, 'last-save-asc');
    expect(sorted.map((repo) => repo.id)).toEqual([2, 1, 3]);
  });

  it('sorts by last save recent -> old', () => {
    const sorted = sortRepositories(repoList, 'last-save-desc');
    expect(sorted.map((repo) => repo.id)).toEqual([3, 1, 2]);
  });

  it('does not mutate the original list', () => {
    const original = [...repoList];
    sortRepositories(repoList, 'alias-desc');
    expect(repoList).toEqual(original);
  });

  it('returns the list unchanged for an unknown sort option', () => {
    const sorted = sortRepositories(repoList, 'unknown-option' as SortOption);
    expect(sorted.map((repo) => repo.id)).toEqual([1, 2, 3]);
  });

  it('treats a zero storageSize as a 0% usage ratio instead of dividing by zero', () => {
    const withZeroSize: Repository[] = [
      { ...repoList[0], id: 10, storageSize: 0, storageUsed: 0 },
      { ...repoList[1], id: 11, storageSize: 100, storageUsed: 50 },
    ];
    const sorted = sortRepositories(withZeroSize, 'storage-used-asc');
    expect(sorted.map((repo) => repo.id)).toEqual([10, 11]);
  });

  it('treats a falsy lastSave as the oldest possible date', () => {
    const withMissingDate: Repository[] = [
      { ...repoList[0], id: 20, lastSave: 0 },
      { ...repoList[1], id: 21, lastSave: 500 },
    ];
    const sorted = sortRepositories(withMissingDate, 'last-save-asc');
    expect(sorted.map((repo) => repo.id)).toEqual([20, 21]);
  });
});
