import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Select, { SingleValue } from 'react-select';
import classes from './SetupWizard.module.css';
import { Optional, SelectedRepoWizard, Repository, WizardEnvType } from '~/types';

//Components
import WizardStep1 from '../../Components/WizardSteps/WizardStep1/WizardStep1';
import WizardStep2 from '../../Components/WizardSteps/WizardStep2/WizardStep2';
import WizardStep3 from '../../Components/WizardSteps/WizardStep3/WizardStep3';
import WizardStep4 from '../../Components/WizardSteps/WizardStep4/WizardStep4';
import WizardStepBar from '../../Components/WizardSteps/WizardStepBar/WizardStepBar';

type SetupWizardProps = {
  step?: number;
};

function SetupWizard(props: SetupWizardProps) {
  const router = useRouter();

  const [repoList, setRepoList] = useState<Optional<Array<Repository>>>();
  const [repoListIsLoading, setRepoListIsLoading] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);
  const [wizardEnv, setWizardEnv] = useState<Optional<WizardEnvType>>();
  const [selectedItem, setSelectedItem] = useState<Optional<SelectedRepoWizard>>();

  ////LifeCycle
  //ComponentDidMount
  useEffect(() => {
    //retrieve the repository list
    const fetchRepoList = async () => {
      try {
        const response = await fetch('/api/v1/repositories', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setRepoList((await response.json()).repoList);
        setRepoListIsLoading(false);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    fetchRepoList();
    //Fetch wizardEnv to hydrate Wizard' steps
    const fetchWizardEnv = async () => {
      try {
        const response = await fetch('/api/v1/account/wizard-env', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        const data: WizardEnvType = await response.json();
        setWizardEnv(data);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    fetchWizardEnv();
  }, []);
  //Component did update
  useEffect(() => {
    //Go to the step in the URL param when URL change
    props.step && setStep(props.step);
  }, [props.step]);

  //Options for react-select
  const options: Optional<Array<SelectedRepoWizard>> = repoList?.map((repo) => ({
    label: `${repo.alias} - ${repo.repositoryName}`,
    value: `${repo.alias} - ${repo.repositoryName}`,
    id: repo.id.toString(),
    repositoryName: repo.repositoryName,
    lanCommand: repo.lanCommand ? repo.lanCommand : false,
  }));

  //Step button (free selection of user)
  const changeStepHandler = (x: number) => router.push('/setup-wizard/' + x.toString());

  //Next Step button
  const nextStepHandler = () => {
    if (step && step < 4) {
      router.push('/setup-wizard/' + `${step + 1}`);
    }
  };

  //Previous Step button
  const previousStepHandler = () => {
    if (step && step > 1) {
      router.push('/setup-wizard/' + `${step - 1}`);
    }
  };

  const onChangeSelect = (option: SingleValue<SelectedRepoWizard>) => {
    if (option) {
      setSelectedItem(option);
    } else {
      setSelectedItem(undefined);
    }
  };

  //Change Step with State
  const wizardStep = (step?: number) => {
    if (!step || step === 1) {
      return <WizardStep1 />;
    } else if (step === 2) {
      return <WizardStep2 selectedRepo={selectedItem} wizardEnv={wizardEnv} />;
    } else if (step === 3) {
      return <WizardStep3 selectedRepo={selectedItem} wizardEnv={wizardEnv} />;
    } else {
      return <WizardStep4 selectedRepo={selectedItem} wizardEnv={wizardEnv} />;
    }
  };

  return (
    <div className={classes.container}>
      <WizardStepBar
        setStep={(x) => changeStepHandler(x)}
        step={step}
        nextStepHandler={() => nextStepHandler()}
        previousStepHandler={() => previousStepHandler()}
      />
      <div className={classes.selectRepo}>
        <Select
          onChange={(item) => onChangeSelect(item)}
          isLoading={repoListIsLoading}
          isDisabled={repoListIsLoading}
          options={options}
          isSearchable
          placeholder='Select your repository...'
          theme={(theme) => ({
            ...theme,
            borderRadius: 5,
            colors: {
              ...theme.colors,
              primary25: '#c3b6fa',
              primary: '#6d4aff',
            },
          })}
        />
      </div>

      {wizardStep(step)}
    </div>
  );
}

export default SetupWizard;
