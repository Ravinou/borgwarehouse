//Lib
import classes from './StorageBar.module.css';

export default function StorageBar(props) {
  //Var
  //storageUsed is in kB, storageSize is in GB. Round to 1 decimal for %.
  const storageUsedPercent = (((props.storageUsed / 1024 ** 2) * 100) / props.storageSize).toFixed(
    1
  );

  return (
    <div className={classes.barContainer}>
      <div className={classes.barBackground}>
        <div
          style={{
            maxWidth: '100%',
            width: storageUsedPercent + '%',
            transition: 'width 0.5s 0s ease',
          }}
        >
          <div className={classes.progressionStyle} />
        </div>
        <div className={classes.tooltip}>
          {storageUsedPercent}% ({(props.storageUsed / 1024 ** 2).toFixed(1)} GB /{' '}
          {props.storageSize} GB)
        </div>
      </div>
    </div>
  );
}
