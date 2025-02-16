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

export type EmailAlert = {
  emailAlert?: boolean;
};
