//Lib
import { ReactNode } from 'react';
import classes from './Info.module.css';

type InfoProps = {
  message: string;
  color?: string;
  children?: ReactNode;
};

export default function Info(props: InfoProps) {
  return (
    <div className={classes.infoMessage} style={{ backgroundColor: props.color }}>
      {props.message}
      {props.children}
    </div>
  );
}
