//Lib
import React from 'react';
import classes from './Repo.module.css';
import { IconSettings, IconInfoCircle } from '@tabler/icons-react';
import timestampConverter from '../../helpers/functions/timestampConverter';
import StorageBar from '../UI/StorageBar/StorageBar';
import QuickCommands from './QuickCommands/QuickCommands';

export default function Repo(props) {
    return (
        <>
            {props.displayDetails ? (
                <>
                    <div className={classes.RepoOpen}>
                        <div className={classes.openFlex}>
                            {props.status ? (
                                <div
                                    className={classes.statusIndicatorGreen}
                                ></div>
                            ) : (
                                <div
                                    className={classes.statusIndicatorRed}
                                ></div>
                            )}
                            <div className={classes.alias}>{props.alias}</div>
                            {props.comment && (
                                <div className={classes.comment}>
                                    <IconInfoCircle size={16} color='grey' />
                                    <div className={classes.toolTip}>
                                        {props.comment}
                                    </div>
                                </div>
                            )}
                            <QuickCommands
                                unixUser={props.unixUser}
                                repository={props.repository}
                                lanCommand={props.lanCommand}
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
                                    <th>{props.repository}</th>
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
                            {props.status ? (
                                <div
                                    className={classes.statusIndicatorGreen}
                                ></div>
                            ) : (
                                <div
                                    className={classes.statusIndicatorRed}
                                ></div>
                            )}
                            <div className={classes.alias}>{props.alias}</div>
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
        </>
    );
}
