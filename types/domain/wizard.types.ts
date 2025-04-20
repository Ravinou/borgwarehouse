import { WizardEnvType } from '~/types/domain/config.types';

export type SelectedRepoWizard = {
  label: string;
  value: string;
  id: string;
  repositoryName: string;
  lanCommand: boolean;
};

export type WizardStepProps = {
  selectedRepo?: SelectedRepoWizard;
  wizardEnv?: WizardEnvType;
};
