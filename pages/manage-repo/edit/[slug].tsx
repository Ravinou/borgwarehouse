// Re-export the index page component so navigating to this modal route reuses
// the SAME React component reference. This keeps <RepoList /> mounted across
// route changes (modal open/close) instead of remounting it with a new state
// and a re-render (which would cause the list to flicker and lose its scroll position).
export { default, getServerSideProps } from '~/pages/index';
