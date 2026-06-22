import classes from './ShimmerRepoList.module.css';

const LOADING_REPO_COUNT = 5;

function ShimmerRepoItem() {
  return (
    <div className={classes.card}>
      <div className={classes.header}>
        <div className={`${classes.avatar} ${classes.skeleton}`} />
        <div className={classes.lines}>
          <div className={`${classes.lineLg} ${classes.skeleton}`} />
          <div className={`${classes.lineSm} ${classes.skeleton}`} />
        </div>
      </div>
      <div className={classes.statRow}>
        <div className={`${classes.stat} ${classes.skeleton}`} />
        <div className={`${classes.stat} ${classes.skeleton}`} />
        <div className={`${classes.stat} ${classes.skeleton}`} />
      </div>
    </div>
  );
}

export default function ShimmerRepoList() {
  return (
    <div className={classes.container}>
      <div className={classes.toolbar}>
        <div className={`${classes.skelSort} ${classes.skeleton}`} />
        <div className={`${classes.skelSearch} ${classes.skeleton}`} />
      </div>
      <div className={classes.loadingRepoContainer}>
        {Array.from({ length: LOADING_REPO_COUNT }, (_, i) => (
          <ShimmerRepoItem key={i} />
        ))}
      </div>
    </div>
  );
}
