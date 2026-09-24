import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { OnboardingStateRepository } from '../../domain/repositories/OnboardingStateRepository';
import { AsyncStorageOnboardingStateRepository } from '../../infrastructure/preferences/AsyncStorageOnboardingStateRepository';

const OnboardingStateRepositoryContext =
  createContext<OnboardingStateRepository | null>(null);

type OnboardingStateProviderProps = {
  children: ReactNode;
  repository?: OnboardingStateRepository;
};

export function OnboardingStateProvider({
  children,
  repository,
}: OnboardingStateProviderProps) {
  const value = useMemo(
    () => repository ?? new AsyncStorageOnboardingStateRepository(),
    [repository],
  );

  return (
    <OnboardingStateRepositoryContext.Provider value={value}>
      {children}
    </OnboardingStateRepositoryContext.Provider>
  );
}

export function useOnboardingStateRepository(): OnboardingStateRepository {
  const repository = useContext(OnboardingStateRepositoryContext);
  if (repository == null) {
    throw new Error(
      'useOnboardingStateRepository must be used within OnboardingStateProvider',
    );
  }
  return repository;
}
