//Lib
import React from 'react';
import classes from './WizardStepBar.module.css';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

function WizardStepBar(props) {
  ////Functions
  //Color onClick on a step
  const colorHandler = (step) => {
    if (step <= props.step) {
      return classes.active;
    } else {
      return classes.inactive;
    }
  };
  //Color onClick on next step button
  const colorChevronNextStep = () => {
    if (props.step < 4) {
      return classes.activeChevron;
    } else {
      return classes.inactiveChevron;
    }
  };
  //Color onClick on previous step button
  const colorChevronPreviousStep = () => {
    if (props.step > 1) {
      return classes.activeChevron;
    } else {
      return classes.inactiveChevron;
    }
  };

  return (
    <div className={classes.stepBarContainer}>
      <IconChevronLeft
        size={32}
        className={colorChevronPreviousStep()}
        onClick={props.previousStepHandler}
      />
      <ul>
        <li className={colorHandler(2)} onClick={() => props.setStep(1)}>
          <div className={[classes.number, colorHandler(1)].join(' ')}>1</div>
          <div className={[classes.text, colorHandler(1)].join(' ')}>Client Setup</div>
          <div className={classes.line}></div>
        </li>
        <li className={colorHandler(3)} onClick={() => props.setStep(2)}>
          <div className={[classes.number, colorHandler(2)].join(' ')}>2</div>
          <div className={[classes.text, colorHandler(2)].join(' ')}>Init. repository</div>
          <div className={classes.line}></div>
        </li>
        <li className={colorHandler(4)} onClick={() => props.setStep(3)}>
          <div className={[classes.number, colorHandler(3)].join(' ')}>3</div>
          <div className={[classes.text, colorHandler(3)].join(' ')}>Launch & Verify</div>
          <div className={classes.line}></div>
        </li>
        <li onClick={() => props.setStep(4)}>
          <div className={[classes.number, colorHandler(4)].join(' ')}>4</div>
          <div className={[classes.text, colorHandler(4)].join(' ')}>Automation</div>
        </li>
      </ul>
      <IconChevronRight
        size={32}
        className={colorChevronNextStep()}
        onClick={props.nextStepHandler}
      />
    </div>
  );
}

export default WizardStepBar;
