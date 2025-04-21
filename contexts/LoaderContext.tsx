import { createContext, useContext } from 'react';
import NProgress from 'nprogress';

type LoaderContextType = {
  start: () => void;
  stop: () => void;
};

const LoaderContext = createContext<LoaderContextType>({
  start: () => {},
  stop: () => {},
});

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const start = () => NProgress.start();
  const stop = () => NProgress.done();

  return (
    <LoaderContext.Provider value={{ start, stop }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
