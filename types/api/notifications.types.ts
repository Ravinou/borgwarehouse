import { AppriseModeEnum } from '../domain/config.types';

export type AppriseModeResponse = {
  appriseMode?: AppriseModeEnum;
  appriseStatelessURL?: string;
};

export type AppriseServicesResponse = {
  appriseServices?: string[];
};

export type AppriseAlertResponse = {
  appriseAlert?: boolean;
};

export type EmailAlertDTO = {
  emailAlert?: boolean;
};

export type AppriseAlertDTO = {
  appriseAlert: boolean;
};

export type AppriseModeDTO = {
  appriseMode: AppriseModeEnum;
  appriseStatelessURL?: string;
};
