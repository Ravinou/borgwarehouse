import { useEffect, useState } from 'react';
import Select, { SingleValue } from 'react-select';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from '~/contexts/LoaderContext';
import { DateFormatEnum, DateFormatSettingDTO, Optional } from '~/types';
import classes from '../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import { useFormStatus } from '~/hooks';

type DateFormatOption = { value: DateFormatEnum; label: string };

const LOCALE_EXAMPLE = new Date(2024, 0, 15, 14, 30).toLocaleString();

const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { value: DateFormatEnum.LOCALE, label: `Browser locale — ${LOCALE_EXAMPLE}` },
  { value: DateFormatEnum.ISO, label: 'ISO — 2024-01-15 14:30' },
  { value: DateFormatEnum.EUROPEAN, label: 'European — 15/01/2024 14:30' },
  { value: DateFormatEnum.US, label: 'US — 01/15/2024 02:30 PM' },
];

export default function DateFormatSettings() {
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const { error, handleError, clearError } = useFormStatus();
  const { start, stop } = useLoader();
  const [dateFormat, setDateFormat] = useState<Optional<DateFormatEnum>>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const dataFetch = async () => {
      try {
        const response = await fetch('/api/v1/account/date-format', {
          method: 'GET',
          headers: { 'Content-type': 'application/json' },
        });
        const data: DateFormatSettingDTO = await response.json();
        setDateFormat(data.dateFormat ?? DateFormatEnum.LOCALE);
      } catch {
        handleError('Failed to load date format setting.');
      }
    };
    dataFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeHandler = async (selected: SingleValue<DateFormatOption>) => {
    if (!selected) return;
    clearError();
    start();
    setIsLoading(true);
    setDateFormat(selected.value);

    try {
      const response = await fetch('/api/v1/account/date-format', {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ dateFormat: selected.value }),
      });

      if (response.ok) {
        toast.success('Date format updated!', toastOptions);
      } else {
        const result = await response.json();
        handleError(result.message ?? 'Failed to update date format.');
      }
    } catch {
      handleError('Failed to update date format.');
    } finally {
      stop();
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.containerSetting}>
      <div className={classes.settingCategory}>
        <h2>Date format</h2>
      </div>
      <div className={classes.setting}>
        <div className={classes.bwFormWrapper}>
          <Select
            isDisabled={dateFormat === undefined || isLoading}
            value={DATE_FORMAT_OPTIONS.find((o) => o.value === dateFormat) ?? null}
            onChange={onChangeHandler}
            options={DATE_FORMAT_OPTIONS}
            isSearchable={false}
            menuPlacement='auto'
            styles={{
              container: (base) => ({ ...base, maxWidth: '80%' }),
              control: (base) => ({ ...base, minHeight: '35px', height: '35px', cursor: 'pointer' }),
              valueContainer: (base) => ({
                ...base,
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
              }),
              input: (base) => ({ ...base, margin: 0 }),
              indicatorsContainer: (base) => ({ ...base, height: '35px' }),
            }}
            theme={(theme) => ({
              ...theme,
              borderRadius: 5,
              colors: {
                ...theme.colors,
                primary25: '#c3b6fa',
                primary: '#6d4aff',
              },
            })}
          />
          {error && <Error message={error} />}
        </div>
      </div>
    </div>
  );
}
