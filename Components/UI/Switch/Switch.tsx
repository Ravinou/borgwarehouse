//Lib
import { Optional } from '~/types';
import classes from './Switch.module.css';
import { SpinnerCircularFixed } from 'spinners-react';

type SwitchProps = {
  switchName: string;
  switchDescription: string;
  checked: Optional<boolean>;
  disabled: boolean;
  loading?: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch(props: SwitchProps) {
  return (
    <div className={classes.switchWrapper}>
      <div className={classes.switch}>
        <label className={classes.switchLabel}>
          {props.loading ? (
            <SpinnerCircularFixed
              size={24}
              thickness={120}
              speed={100}
              color='#704dff'
              secondaryColor='#e0dcfc'
            />
          ) : (
            <>
              <input
                type='checkbox'
                checked={props.checked || false}
                disabled={props.disabled}
                onChange={(e) => props.onChange(e.target.checked)}
              />
              <span className={classes.switchSlider}></span>
            </>
          )}
          <span className={classes.switchText}>{props.switchName}</span>
        </label>
      </div>
      <p className={classes.switchDescription}>{props.switchDescription}</p>
    </div>
  );
}
