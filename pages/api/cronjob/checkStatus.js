// This API is design to be used by a cron (of your choice). Call it with curl for example
//(e.g : curl --request POST --url 'http://localhost:3000/api/cronjob/checkStatus' --header 'Authorization: Bearer 5173f388c0f4a0df92d1412c3036ddc897c22e4448')

//Lib
import { promises as fs } from 'fs';
import path from 'path';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
import nodemailerSMTP from '../../../helpers/functions/nodemailerSMTP';
import emailAlertStatus from '../../../helpers/templates/emailAlertStatus';

export default async function handler(req, res) {
    if (req.headers.authorization == null) {
        res.status(401).json({
            status: 401,
            message: 'Unauthorized',
        });
        return;
    }

    const CRONJOB_KEY = process.env.CRONJOB_KEY;
    const ACTION_KEY = req.headers.authorization.split(' ')[1];

    if (req.method == 'POST' && ACTION_KEY === CRONJOB_KEY) {
        //Var
        let newRepoList;
        let repoListToSendAlert = [];
        let usersList;
        const date = Math.round(Date.now() / 1000);
        const jsonDirectory = path.join(process.cwd(), '/config');

        ////PART 1 : Status
        try {
            //Check if there are some repositories
            let repoList = await fs.readFile(
                jsonDirectory + '/repo.json',
                'utf8'
            );
            repoList = JSON.parse(repoList);
            if (repoList.length === 0) {
                res.status(200).json({
                    success:
                        'Status cron has been executed. No repository to check.',
                });
                return;
            }

            //Call the shell : getLastSave.sh
            //Find the absolute path of the shells directory
            const shellsDirectory = path.join(process.cwd(), '/helpers');
            //Exec the shell
            const { stdout, stderr } = await exec(
                `${shellsDirectory}/shells/getLastSave.sh`
            );
            if (stderr) {
                console.log('stderr:', stderr);
                res.status(500).json({
                    status: 500,
                    message:
                        'Error on getting the date for last save, contact the administrator.',
                });
                return;
            }
            //Parse the JSON output of getLastSave.sh to use it
            const lastSave = JSON.parse(stdout);

            //Rebuild a newRepoList with the lastSave timestamp updated and the status updated.
            newRepoList = repoList;
            for (let index in newRepoList) {
                const repoFiltered = lastSave.filter(
                    (x) =>
                        x.repositoryName === newRepoList[index].repositoryName
                );
                if (repoFiltered.length === 1) {
                    //Write the timestamp of the last save
                    newRepoList[index].lastSave = repoFiltered[0].lastSave;
                    //Trigger the status if the last save is older than alert setting.
                    if (
                        date - newRepoList[index].lastSave >
                        newRepoList[index].alert
                    ) {
                        newRepoList[index].status = false;
                    } else if (
                        date - newRepoList[index].lastSave <
                        newRepoList[index].alert
                    ) {
                        newRepoList[index].status = true;
                    }
                }
            }
        } catch (err) {
            res.status(500).json({
                status: 500,
                message: "API error : can't update the status.",
            });
            return;
        }

        //// PART 2 : check if there is a repo that need an alert
        try {
            //Here, a mail is sent every 24H (90000) if a repo has down status
            for (let index in newRepoList) {
                if (
                    !newRepoList[index].status &&
                    newRepoList[index].alert !== 0 &&
                    (!newRepoList[index].lastStatusAlertSend ||
                        date - newRepoList[index].lastStatusAlertSend > 90000)
                ) {
                    repoListToSendAlert.push(newRepoList[index].alias);
                    newRepoList[index].lastStatusAlertSend = date;
                }
            }
        } catch (err) {
            res.status(500).json({
                status: 500,
                message:
                    "API error : can't check if a repo needs an email alert.",
            });
            return;
        }

        //PART 3 : Save the new repoList
        try {
            //Stringify the repoList to write it into the json file.
            newRepoList = JSON.stringify(newRepoList);
            //Write the new json
            await fs.writeFile(
                jsonDirectory + '/repo.json',
                newRepoList,
                (err) => {
                    if (err) console.log(err);
                }
            );
        } catch (err) {
            res.status(500).json({
                status: 500,
                message: "API error : can't write the new repoList.",
            });
            return;
        }
        //PART 4 : Send the alerts
        if (repoListToSendAlert.length > 0) {
            // Read user informations
            try {
                //Read the email of the user
                usersList = await fs.readFile(
                    jsonDirectory + '/users.json',
                    'utf8'
                );
                //Parse the usersList
                usersList = JSON.parse(usersList);
            } catch (err) {
                res.status(500).json({
                    status: 500,
                    message: "API error : can't read user information.",
                });
                return;
            }
            ////EMAIL
            // If the user has enabled email alerts
            if (usersList[0].emailAlert) {
                //Send mail
                //Create the SMTP Transporter
                const transporter = nodemailerSMTP();
                //Mail options
                const mailData = emailAlertStatus(
                    usersList[0].email,
                    usersList[0].username,
                    repoListToSendAlert
                );
                transporter.sendMail(mailData, function (err, info) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(info);
                    }
                });
            }
            ////APPRISE
            // If the user has enabled Apprise alerts
            if (usersList[0].appriseAlert) {
                let appriseServicesURLs = '';
                for (let service of usersList[0].appriseServices) {
                    appriseServicesURLs = appriseServicesURLs + service + ' ';
                }
                //Mode : package
                if (usersList[0].appriseMode === 'package') {
                    try {
                        //Send notification via local package.
                        await exec(
                            `apprise -v -b '🔴 Some repositories on BorgWarehouse need attention !\nList of down repositories :\n ${repoListToSendAlert}' ${appriseServicesURLs}`
                        );
                    } catch (err) {
                        console.log(err.stderr);
                        res.status(500).json({
                            message: 'Error : ' + err.stderr,
                        });
                        return;
                    }

                    //Mode : stateless
                } else if (usersList[0].appriseMode === 'stateless') {
                    try {
                        await fetch(
                            usersList[0].appriseStatelessURL + '/notify',
                            {
                                method: 'POST',
                                headers: {
                                    'Content-type': 'application/json',
                                },
                                body: JSON.stringify({
                                    urls: appriseServicesURLs,
                                    body:
                                        '🔴 Some repositories on BorgWarehouse need attention !\nList of down repositories :\n' +
                                        repoListToSendAlert,
                                }),
                            }
                        );
                    } catch (err) {
                        console.log(err);
                        res.status(500).json({
                            message: 'Error : ' + err.message,
                        });
                        return;
                    }

                    //Mode : unknown
                } else {
                    res.status(422).json({
                        message: 'No Apprise Mode selected or supported.',
                    });
                }
            }
        }

        //PART 5 : Sucess
        res.status(200).json({
            success: 'Status cron has been executed.',
        });
        return;
    } else {
        res.status(401).json({
            status: 401,
            message: 'Unauthorized',
        });
        return;
    }
}
