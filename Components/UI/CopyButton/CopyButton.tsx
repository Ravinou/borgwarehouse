//Lib
import classes from './CopyButton.module.css';
import { useState } from 'react';
import { IconChecks, IconCopy } from '@tabler/icons-react';

export default function CopyButton(props) {
  //State
  const [isCopied, setIsCopied] = useState(false);

  //Function
  const handleCopy = async (data) => {
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
