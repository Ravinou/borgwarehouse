import classes from './WizardStepBar.module.css';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

type WizardStepBarProps = {
  step: number;
  setStep: (step: number) => void;
  previousStepHandler: () => void;
  nextStepHandler: () => void;
};

const STEPS = ['Client Setup', 'Init. repository', 'Launch & Verify', 'Automation'];

function WizardStepBar(props: WizardStepBarProps) {
  const total = STEPS.length;
  const current = Math.min(Math.max(props.step, 1), total);
  // Continuous progress from the first to the current step (0–100%).
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className={classes.stepBarContainer}>
      <button
        type='button'
        className={classes.chevron}
        onClick={props.previousStepHandler}
        disabled={current <= 1}
        aria-label='Previous step'
      >
        <IconChevronLeft size={26} />
      </button>

      <div className={classes.steps}>
        <div className={classes.track} aria-hidden='true'>
          <div className={classes.trackFill} style={{ width: `${progress}%` }} />
        </div>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const isActive = n <= current;
          return (
            <button
              type='button'
              key={label}
              className={classes.step}
              onClick={() => props.setStep(n)}
            >
              <span className={`${classes.number} ${isActive ? classes.active : ''}`}>{n}</span>
              <span className={`${classes.text} ${isActive ? classes.active : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>

      <button
        type='button'
        className={classes.chevron}
        onClick={props.nextStepHandler}
        disabled={current >= total}
        aria-label='Next step'
      >
        <IconChevronRight size={26} />
      </button>
    </div>
  );
}

export default WizardStepBar;
