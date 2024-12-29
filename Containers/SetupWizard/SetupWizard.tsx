//Lib
import React from 'react';
import classes from './SetupWizard.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Select from 'react-select';

//Components
import WizardStepBar from '../../Components/WizardSteps/WizardStepBar/WizardStepBar';
import WizardStep1 from '../../Components/WizardSteps/WizardStep1/WizardStep1';
import WizardStep2 from '../../Components/WizardSteps/WizardStep2/WizardStep2';
import WizardStep3 from '../../Components/WizardSteps/WizardStep3/WizardStep3';
import WizardStep4 from '../../Components/WizardSteps/WizardStep4/WizardStep4';

function SetupWizard(props) {
  ////Var
  const router = useRouter();

  ////States
  const [list, setList] = useState([]);
  const [listIsLoading, setListIsLoading] = useState(true);
  const [step, setStep] = useState();
  const [wizardEnv, setWizardEnv] = useState({});
  const [selectedOption, setSelectedOption] = useState({
    id: '#id',
    repository: 'repo',
  });

  ////LifeCycle
  //ComponentDidMount
  useEffect(() => {
    //retrieve the repository list
    const repoList = async () => {
      try {
        const response = await fetch('/api/repo', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setList((await response.json()).repoList);
        setListIsLoading(false);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    repoList();
    //Fetch wizardEnv to hydrate Wizard' steps
    const fetchWizardEnv = async () => {
      try {
        const response = await fetch('/api/account/getWizardEnv', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setWizardEnv((await response.json()).wizardEnv);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    fetchWizardEnv();
  }, []);
  //Component did update
  useEffect(() => {
    //Go to the step in the URL param when URL change
    setStep(props.step);
  }, [props.step]);

  ////Functions

  //Options for react-select
  const options = list.map((repo) => ({
    label: `${repo.alias} - #${repo.id}`,
    value: `${repo.alias} - #${repo.id}`,
    id: repo.id,
    repositoryName: repo.repositoryName,
    lanCommand: repo.lanCommand,
  }));

  //Step button (free selection of user)
  const changeStepHandler = (x) => router.push('/setup-wizard/' + x);

  //Next Step button
  const nextStepHandler = () => {
    if (step < 4) {
      router.push('/setup-wizard/' + `${Number(step) + 1}`);
    }
  };

  //Previous Step button
  const previousStepHandler = () => {
    if (step > 1) {
      router.push('/setup-wizard/' + `${Number(step) - 1}`);
    }
  };

  //Change Step with State
  const wizardStep = (step) => {
    if (step == 1) {
      return <WizardStep1 />;
    } else if (step == 2) {
      return <WizardStep2 selectedOption={selectedOption} wizardEnv={wizardEnv} />;
    } else if (step == 3) {
      return <WizardStep3 selectedOption={selectedOption} wizardEnv={wizardEnv} />;
    } else {
      return <WizardStep4 selectedOption={selectedOption} wizardEnv={wizardEnv} />;
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
          onChange={setSelectedOption}
          isLoading={listIsLoading}
          isDisabled={listIsLoading}
          options={options}
          isSearchable
          placeholder='Select your repository...'
          theme={(theme) => ({
            ...theme,
            borderRadius: '5px',
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
