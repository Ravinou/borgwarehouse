//Lib
import classes from './StorageBar.module.css';

export default function StorageBar(props) {
    //Var
    //storageUsed is in octet, storageSize is in Go. Round to 1 decimal for %.
    const storageUsedPercent = (
        ((props.storageUsed / 1000000) * 100) /
        props.storageSize
    ).toFixed(1);

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
                    {storageUsedPercent}% (
                    {(props.storageUsed / 1000000).toFixed(1)}Go/
                    {props.storageSize}Go)
                </div>
            </div>
        </div>
    );
}
