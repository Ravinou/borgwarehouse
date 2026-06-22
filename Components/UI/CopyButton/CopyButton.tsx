import classes from './CopyButton.module.css';
import { useState, ReactNode } from 'react';
import { IconChecks, IconCopy, IconCheck } from '@tabler/icons-react';

type CopyButtonProps = {
  dataToCopy: string;
  children?: ReactNode;
  displayIconConfirmation?: boolean;
  size?: number;
  stroke?: number;
  variant?: 'inline' | 'pill';
  label?: string;
};

export default function CopyButton(props: CopyButtonProps) {
  const { variant = 'inline', label = 'Copy' } = props;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (data: string) => {
    navigator.clipboard
      .writeText(data)
      .then(() => {
        // If successful, update the isCopied state value
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (variant === 'pill') {
    return (
      <button
        type='button'
        onClick={() => handleCopy(props.dataToCopy)}
        className={`${classes.pillButton} ${isCopied ? classes.pillCopied : ''}`}
        title='Copy'
        aria-label='Copy'
      >
        {isCopied ? (
          <>
            <IconCheck size={props.size || 13} stroke={props.stroke || 2} />
            Copied
          </>
        ) : (
          <>
            <IconCopy size={props.size || 13} stroke={props.stroke || 1.75} />
            {label}
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <button className={classes.copyButton} onClick={() => handleCopy(props.dataToCopy)}>
        {props.children}
        {isCopied && props.displayIconConfirmation ? (
          <IconChecks color='#07bc0c' stroke={props.stroke || 1.25} size={props.size} />
        ) : (
          <IconCopy color='#65748b' stroke={props.stroke || 1.25} size={props.size} />
        )}
      </button>
      {isCopied
        ? !props.displayIconConfirmation && <span className={classes.copyValid}>Copied !</span>
        : null}
    </>
  );
}
