import { DateFormatEnum } from '../domain/config.types';

export type EmailSettingDTO = {
  email?: string;
};

export type DateFormatSettingDTO = {
  dateFormat: DateFormatEnum;
};

export type UsernameSettingDTO = {
  username?: string;
};

export type PasswordSettingDTO = {
  oldPassword: string;
  newPassword: string;
};
