import { getUnixTime } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'util';
import { getRepoList, getUsersList, updateRepoList } from '~/helpers/functions/fileHelpers';
import nodemailerSMTP from '~/helpers/functions/nodemailerSMTP';
import { getLastSaveList } from '~/helpers/functions/shell.utils';
import emailAlertStatus from '~/helpers/templates/emailAlertStatus';
import { ErrorResponse, SuccessResponse } from '~/types/api/error.types';

const exec = promisify(execCallback);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | SuccessResponse>
) {
  if (!req.headers.authorization) {
    return res.status(401);
  }

  const CRONJOB_KEY = process.env.CRONJOB_KEY;
  const ACTION_KEY = req.headers.authorization.split(' ')[1];

  if (req.method !== 'POST' || ACTION_KEY !== CRONJOB_KEY) {
    return res.status(401);
  }

  try {
    const repoList = await getRepoList();
    const lastSaveList = await getLastSaveList();
    if (repoList.length === 0 || lastSaveList.length === 0) {
      return res.status(200).json({ message: 'Status cron executed. No repository to check.' });
    }

    const date = getUnixTime(new Date());

    // Update the status and the last timestamp backup of each repository
    const updatedRepoList = repoList.map((repo) => {
      const repoFiltered = lastSaveList.find((x) => x.repositoryName === repo.repositoryName);
      if (!repoFiltered) return repo;
      const lastSaveTimestamp = repoFiltered.lastSave;
      return {
        ...repo,
        lastSave: lastSaveTimestamp,
        status: date - lastSaveTimestamp <= (repo?.alert ?? 0),
      };
    });

    const repoListToSendAlert: string[] = [];
    updatedRepoList.forEach((repo) => {
      if (
        !repo.status &&
        repo.alert !== 0 &&
        (!repo.lastStatusAlertSend || date - repo.lastStatusAlertSend > 90000)
      ) {
        repo.lastStatusAlertSend = date;
        repoListToSendAlert.push(repo.alias);
      }
    });

    if (repoListToSendAlert.length > 0) {
      const usersList = await getUsersList();

      // Send Email Alert
      if (usersList[0].emailAlert) {
        const transporter = nodemailerSMTP();
        const mailData = emailAlertStatus(
          usersList[0].email,
          usersList[0].username,
          repoListToSendAlert
        );
        transporter.sendMail(mailData, (err) => {
          if (err) console.log(err);
        });
      }

      // Send Apprise Alert
      if (usersList[0].appriseAlert) {
        const appriseServicesURLs = usersList[0].appriseServices?.join(' ');
        const message = `🔴 Some repositories on BorgWarehouse need attention !\nList of down repositories :\n ${repoListToSendAlert}`;
        if (usersList[0].appriseMode === 'package') {
          await exec(`apprise -v -b '${message}' ${appriseServicesURLs}`);
        } else if (usersList[0].appriseMode === 'stateless') {
          await fetch(`${usersList[0].appriseStatelessURL}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: appriseServicesURLs, body: message }),
          });
        } else {
          return res.status(422).json({ message: 'No Apprise Mode selected or supported.' });
        }
      }
    }

    await updateRepoList(updatedRepoList);
    return res.status(200).json({ message: 'Status cron executed successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, message: 'API error, contact the administrator.' });
  }
}
