import { fromUnixTime, format } from 'date-fns';
import { DateFormatEnum } from '~/types';

export function formatDate(unixTimestamp: number, dateFormat?: DateFormatEnum): string {
  const date = fromUnixTime(unixTimestamp);
  if (!dateFormat || dateFormat === DateFormatEnum.LOCALE) {
    return date.toLocaleString();
  }
  return format(date, dateFormat);
}
