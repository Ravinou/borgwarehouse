import classes from './Error.module.css';

type ErrorProps = {
  message: string;
};

export default function Error(props: ErrorProps) {
  return <div className={classes.errorMessage}>{props.message}</div>;
}
