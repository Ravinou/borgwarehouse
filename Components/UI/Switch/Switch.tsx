//Lib
import classes from './Switch.module.css';

export default function Switch(props) {
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
