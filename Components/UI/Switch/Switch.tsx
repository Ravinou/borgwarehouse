import { Optional } from '~/types';
import classes from './Switch.module.css';
import { useLoader } from '~/contexts/LoaderContext';
import { useEffect } from 'react';

type SwitchProps = {
  switchName: string;
  switchDescription: string;
  checked: Optional<boolean>;
  disabled: boolean;
  loading?: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch(props: SwitchProps) {
  const { start, stop } = useLoader();

  useEffect(() => {
    if (props.loading) {
      start();
    } else {
      stop();
    }
  }, [props.loading, start, stop]);

  return (
    <div className={classes.switchWrapper}>
      <div className={classes.switch}>
        <label className={classes.switchLabel}>
          <>
            <input
              type='checkbox'
              checked={props.checked || false}
              disabled={props.disabled}
              onChange={(e) => props.onChange(e.target.checked)}
            />
            <span className={classes.switchSlider}></span>
          </>
          <span className={classes.switchText}>{props.switchName}</span>
        </label>
      </div>
      <p className={classes.switchDescription}>{props.switchDescription}</p>
    </div>
  );
}
