import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import repoHistory from '../../../helpers/functions/repoHistory';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default async function handler(req, res) {
    if (req.method == 'POST') {
        //Verify that the user is logged in.
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: 'You must be logged in.' });
            return;
        }

        //The data we expect to receive
        const { alias, sshPublicKey, size, comment, alert, lanCommand } =
            req.body;
        //We check that we receive data for each variable. Only "comment" and "lanCommand" are optional in the form.
        if (!alias || !sshPublicKey || !size || (!alert && alert !== 0)) {
            //If a variable is empty.
            res.status(422).json({
                message: 'Unexpected data',
            });
            //A return to make sure we don't go any further if data are incorrect.
            return;
        }

        try {
            //console.log('API call (PUT)');
            //Find the absolute path of the json directory
            const jsonDirectory = path.join(process.cwd(), '/config');
            let repoList = await fs.readFile(
                jsonDirectory + '/repo.json',
                'utf8'
            );
            //Parse the repoList
            repoList = JSON.parse(repoList);

            //Find the first biggest ID available to assign it, so the highest ID is already the last added.
            let newID = 0;
            for (let element in repoList) {
                if (newID <= repoList[element].id) {
                    newID = repoList[element].id + 1;
                }
            }
            //Create the new repo object
            const newRepo = {
                id: newID,
                alias: alias,
                repositoryName: '',
                status: false,
                lastSave: 0,
                alert: alert,
                storageSize: Number(size),
                storageUsed: 0,
                sshPublicKey: sshPublicKey,
                comment: comment,
                displayDetails: true,
                lanCommand: lanCommand,
            };

            ////Call the shell : createRepo.sh
            //Find the absolute path of the shells directory
            const shellsDirectory = path.join(process.cwd(), '/helpers');
            //Exec the shell
            const { stdout } = await exec(
                `${shellsDirectory}/shells/createRepo.sh "${newRepo.sshPublicKey}" ${newRepo.storageSize}`
            );

            newRepo.repositoryName = stdout.trim();

            //Create the new repoList with the new repo
            let newRepoList = [newRepo, ...repoList];

            //History the new repoList
            await repoHistory(newRepoList);

            //Stringify the newRepoList to write it into the json file.
            newRepoList = JSON.stringify(newRepoList);

            //Write the new json
            await fs.writeFile(
                jsonDirectory + '/repo.json',
                newRepoList,
                (err) => {
                    if (err) console.log(err);
                }
            );
            res.status(200).json({ message: 'Envoi API réussi' });
        } catch (error) {
            //Log for backend
            console.log(error);
            //Log for frontend
            if (error.code == 'ENOENT') {
                res.status(500).json({
                    status: 500,
                    message: 'No such file or directory',
                });
            } else {
                res.status(500).json({
                    status: 500,
                    message: error.stdout,
                });
            }
            return;
        }
    } else {
        res.status(405).json({
            status: 405,
            message: 'Method Not Allowed ',
        });
    }
}
