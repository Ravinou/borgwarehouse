import classes from './StorageBar.module.css';

type StorageBarProps = {
  storageUsed: number;
  storageSize: number;
};

export default function StorageBar(props: StorageBarProps) {
  //storageUsed is in kB, storageSize is in GB.
  const usedGB = props.storageUsed / 1024 ** 2;
  const rawPercent = props.storageSize ? (usedGB * 100) / props.storageSize : 0;
  const percent = Math.min(rawPercent, 100);
  const percentLabel = rawPercent.toFixed(1);

  //Color ramp by fill level
  const level = rawPercent >= 90 ? classes.high : rawPercent >= 75 ? classes.mid : classes.low;

  return (
    <div className={classes.barContainer}>
      <div className={classes.barBackground}>
        <div className={`${classes.progressionStyle} ${level}`} style={{ width: percent + '%' }} />
      </div>
      <span className={classes.percentLabel}>
        {percentLabel}%
        <span className={classes.detail}>
          {usedGB.toFixed(1)} / {props.storageSize} GB
        </span>
      </span>
    </div>
  );
}
