import classes from './ShimmerRepoList.module.css';

const LOADING_REPO_COUNT = 5;

function ShimmerRepoItem() {
  return <div className={classes.repoIsLoading} />;
}

export default function ShimmerRepoList() {
  return (
    <div className={classes.container}>
      <div className={classes.loadingButtonContainer}>
        <div className={classes.buttonIsLoading} />
      </div>
      <div className={classes.loadingRepoContainer}>
        {Array.from({ length: LOADING_REPO_COUNT }, (_, i) => (
          <ShimmerRepoItem key={i} />
        ))}
      </div>
    </div>
  );
}
