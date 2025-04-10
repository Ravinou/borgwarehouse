import { useState } from 'react';
import { Optional } from '~/types';

export function useFormStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<Optional<string>>(undefined);

  const handleSuccess = () => {
    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleError = (message: string) => {
    setIsLoading(false);
    setError(message);
    setTimeout(() => setError(undefined), 4000);
  };

  const clearError = () => setError(undefined);

  return {
    isLoading,
    isSaved,
    error,
    setIsLoading,
    handleSuccess,
    handleError,
    clearError,
  };
}
