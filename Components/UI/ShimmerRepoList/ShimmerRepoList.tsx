//Lib
import classes from './ShimmerRepoList.module.css';

export default function ShimmerRepoList() {
  return (
    <div className={classes.container}>
      <div className={classes.loadingButtonContainer}>
        <div className={classes.buttonIsLoading} />
      </div>
      <div className={classes.loadingRepoContainer}>
        <div className={classes.repoIsLoading} />
        <div className={classes.repoIsLoading} />
        <div className={classes.repoIsLoading} />
        <div className={classes.repoIsLoading} />
        <div className={classes.repoIsLoading} />
      </div>
    </div>
  );
}
