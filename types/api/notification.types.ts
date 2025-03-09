import { AppriseModeEnum } from '../domain/config.types';

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
  appriseMode?: AppriseModeEnum;
  appriseStatelessURL?: string;
};

export type AppriseServicesDTO = {
  appriseServices?: string[];
};
