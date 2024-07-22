// This API is design to be used by a cron (of your choice). Call it with curl for example
//(e.g : curl --request POST --url 'http://localhost:3000/api/cronjob/getStorageUsed' --header 'Authorization: Bearer 5173f388c0f4a0df92d1412c3036ddc897c22e4448')

//Lib
import { promises as fs } from 'fs';
import path from 'path';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

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

  try {
    if (req.method == 'POST' && ACTION_KEY === CRONJOB_KEY) {
      //Check the repoList
      const jsonDirectory = path.join(process.cwd(), '/config');
      let repoList = await fs.readFile(jsonDirectory + '/repo.json', 'utf8');
      //Parse the repoList
      repoList = JSON.parse(repoList);
      //If repoList is empty we stop here.
      if (repoList.length === 0) {
        res.status(200).json({
          success: 'No repositories to analyse yet.',
        });
        return;
      }

      ////Call the shell : getStorageUsed.sh
      //Find the absolute path of the shells directory
      const shellsDirectory = path.join(process.cwd(), '/helpers');
      //Exec the shell
      const { stdout, stderr } = await exec(`${shellsDirectory}/shells/getStorageUsed.sh`);
      if (stderr) {
        res.status(500).json({
          status: 500,
          message: 'Error on getting storage, contact the administrator.',
        });
        return;
      }
      //Parse the JSON output of getStorageUsed.sh to use it
      const storageUsed = JSON.parse(stdout);

      //Rebuild a newRepoList with the storageUsed value updated
      let newRepoList = repoList;
      for (let index in newRepoList) {
        const repoFiltered = storageUsed.filter(
          (x) => x.name === newRepoList[index].repositoryName
        );
        if (repoFiltered.length === 1) {
          newRepoList[index].storageUsed = repoFiltered[0].size;
        }
      }

      //Stringify the repoList to write it into the json file.
      newRepoList = JSON.stringify(newRepoList);
      //Write the new json
      await fs.writeFile(jsonDirectory + '/repo.json', newRepoList, (err) => {
        if (err) console.log(err);
      });

      res.status(200).json({
        success: 'Storage cron has been executed.',
      });
    } else {
      res.status(401).json({
        status: 401,
        message: 'Unauthorized',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 500,
      message: 'API error, contact the administrator.',
    });
  }
}
