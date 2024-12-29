export type Repository = {
  id: number;
  alias: string;
  repositoryName: string;
  status: boolean;
  lastSave: number;
  alert: number;
  storageSize: number;
  storageUsed: number;
  sshPublicKey: string;
  comment: string;
  displayDetails: boolean;
  unixUser: string;
  lanCommand: boolean;
  appendOnlyMode: boolean;
};
