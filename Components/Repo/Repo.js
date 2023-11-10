//Lib
import { useState } from 'react';
import classes from './Repo.module.css';
import {
    IconSettings,
    IconInfoCircle,
    IconChevronDown,
    IconChevronUp,
    IconBellOff,
} from '@tabler/icons-react';
import timestampConverter from '../../helpers/functions/timestampConverter';
import StorageBar from '../UI/StorageBar/StorageBar';
import QuickCommands from './QuickCommands/QuickCommands';

export default function Repo(props) {
    //Load displayDetails from LocalStorage
    const displayDetailsFromLS = () => {
        try {
            if (
                localStorage.getItem('displayDetailsRepo' + props.id) === null
            ) {
                localStorage.setItem(
                    'displayDetailsRepo' + props.id,
                    JSON.stringify(true)
                );
                return true;
            } else {
                return JSON.parse(
                    localStorage.getItem('displayDetailsRepo' + props.id)
                );
            }
        } catch (error) {
            console.log(
                'LocalStorage error, key',
                'displayDetailsRepo' + props.id,
                'will be removed. Try again.',
                'Error message on this key : ',
                error
            );
            localStorage.removeItem('displayDetailsRepo' + props.id);
        }
    };

    //States
    const [displayDetails, setDisplayDetails] = useState(displayDetailsFromLS);

    //BUTTON : Display or not repo details for ONE repo
    const displayDetailsForOneHandler = (boolean) => {
        //Update localStorage
        localStorage.setItem(
            'displayDetailsRepo' + props.id,
            JSON.stringify(boolean)
        );
        setDisplayDetails(boolean);
    };

    //Status indicator
    const statusIndicator = () => {
        return props.status
            ? classes.statusIndicatorGreen
            : classes.statusIndicatorRed;
    };

    //Alert indicator
    const alertIndicator = () => {
        if (props.alert === 0) {
            return (
                <div className={classes.alertIcon}>
                    <IconBellOff size={16} color='grey' />
                </div>
            );
        }
    };

    return (
        <>
            {displayDetails ? (
                <>
                    <div className={classes.RepoOpen}>
                        <div className={classes.openFlex}>
                            <div className={statusIndicator()} />
                            <div className={classes.alias}>{props.alias}</div>
                            {alertIndicator()}
                            {props.comment && (
                                <div className={classes.comment}>
                                    <IconInfoCircle size={16} color='grey' />
                                    <div className={classes.toolTip}>
                                        {props.comment}
                                    </div>
                                </div>
                            )}
                            <QuickCommands
                                repositoryName={props.repositoryName}
                                lanCommand={props.lanCommand}
                                wizardEnv={props.wizardEnv}
                            />
                        </div>

                        <table className={classes.tabInfo}>
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>Repository</th>
                                    <th style={{ width: '10%' }}>
                                        Storage Size
                                    </th>
                                    <th style={{ width: '30%' }}>
                                        Storage Used
                                    </th>
                                    <th style={{ width: '15%' }}>
                                        Last change
                                    </th>
                                    <th style={{ width: '5%' }}>ID</th>
                                    <th style={{ width: '5%' }}>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th>{props.repositoryName}</th>
                                    <th>{props.storageSize}Go</th>
                                    <th style={{ padding: '0 4% 0 4%' }}>
                                        <StorageBar
                                            storageUsed={props.storageUsed}
                                            storageSize={props.storageSize}
                                        />
                                    </th>
                                    <th>
                                        <div className={classes.lastSave}>
                                            {props.lastSave === 0
                                                ? '-'
                                                : timestampConverter(
                                                      props.lastSave
                                                  )}
                                        </div>
                                    </th>
                                    <th>#{props.id}</th>
                                    <th>
                                        <div className={classes.editButton}>
                                            <IconSettings
                                                width={24}
                                                color='#6d4aff'
                                                onClick={() =>
                                                    props.repoManageEditHandler()
                                                }
                                            />
                                        </div>
                                    </th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    <div className={classes.RepoClose}>
                        <div className={classes.closeFlex}>
                            <div className={statusIndicator()} />
                            <div className={classes.alias}>{props.alias}</div>
                            {alertIndicator()}
                            {props.comment && (
                                <div className={classes.comment}>
                                    <IconInfoCircle size={16} color='#637381' />
                                    <div className={classes.toolTip}>
                                        {props.comment}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={classes.lastSave}>
                            {props.lastSave === 0
                                ? null
                                : timestampConverter(props.lastSave)}
                            <span
                                style={{ marginLeft: '20px', color: '#637381' }}
                            >
                                #{props.id}
                            </span>
                        </div>
                    </div>
                </>
            )}
            {displayDetails ? (
                <div className={classes.chevron}>
                    <IconChevronUp
                        color='#494b7a'
                        size={28}
                        onClick={() => {
                            displayDetailsForOneHandler(false);
                        }}
                    />
                </div>
            ) : (
                <div className={classes.chevron}>
                    <IconChevronDown
                        color='#494b7a'
                        size={28}
                        onClick={() => {
                            displayDetailsForOneHandler(true);
                        }}
                    />
                </div>
            )}
        </>
    );
}
