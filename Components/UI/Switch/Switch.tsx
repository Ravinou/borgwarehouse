//Lib
import { Optional } from '~/types';
import classes from './Switch.module.css';

type SwitchProps = {
  switchName: string;
  switchDescription: string;
  checked: Optional<boolean>;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch(props: SwitchProps) {
  return (
    <>
      <div className={classes.switchWrapper}>
        <div className={classes.switch}>
          <label className={classes.pureMaterialSwitch}>
            <input
              checked={props.checked}
              disabled={props.disabled}
              type='checkbox'
              onChange={(e) => props.onChange(e.target.checked)}
            />

            <span>{props.switchName}</span>
          </label>
        </div>
        <div className={classes.switchDescription}>
          <span>{props.switchDescription}</span>
        </div>
      </div>
    </>
  );
}
