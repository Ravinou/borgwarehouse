export type IntegrationTokenType = {
  name: string;
  creation: number;
  expiration?: number;
  permissions: TokenPermissionsType;
};

export type TokenPermissionsType = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export enum TokenPermissionEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
