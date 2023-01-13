//Lib
import classes from './Info.module.css';

export default function Info(props) {
    return <div className={classes.infoMessage}>{props.message}</div>;
}
