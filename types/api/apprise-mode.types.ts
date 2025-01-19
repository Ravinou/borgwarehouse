import { AppriseModeEnum } from '../domain/config.types';

export type AppriseModeResponse = {
  appriseMode: AppriseModeEnum;
  appriseStatelessURL: string;
};
