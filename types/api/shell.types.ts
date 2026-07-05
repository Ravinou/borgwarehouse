export type LastSaveDTO = {
  repositoryName: string;
  lastSave: number;
};

export type StorageUsedDTO = {
  size: number;
  name: string;
};

export type StorageTargetStatus = 'online' | 'unreachable';

export type StorageTargetStatusDTO = {
  path: string;
  status: StorageTargetStatus;
};

export type StorageTarget = {
  path: string;
  name: string;
};

export type StorageTargetStatusWithNameDTO = StorageTargetStatusDTO & {
  name: string;
};
