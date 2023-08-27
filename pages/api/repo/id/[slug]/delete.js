import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default async function handler(req, res) {
    if (req.method == 'DELETE') {
        //Verify that the user is logged in.
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: 'You must be logged in.' });
            return;
        }

        //The data we expect to receive
        const { toDelete } = req.body;
        ////We check that we receive toDelete and it must be a bool.
        if (typeof toDelete != 'boolean' || toDelete === false) {
            //If a variable is empty.
            res.status(422).json({
                message: 'Unexpected data',
            });
            //A return to make sure we don't go any further if data are incorrect.
            return;
        }
        try {
            //console.log('API call (DELETE)');
            //Find the absolute path of the json directory
            const jsonDirectory = path.join(process.cwd(), '/config');
            let repoList = await fs.readFile(
                jsonDirectory + '/repo.json',
                'utf8'
            );
            //Parse the repoList
            repoList = JSON.parse(repoList);

            //Find the ID in the repoList and delete the repo.
            //NOTE : req.query.slug return a string, so parseInt to use with indexOf.
            const indexToDelete = repoList
                .map((repo) => repo.id)
                .indexOf(parseInt(req.query.slug));

            ////Call the shell : deleteRepo.sh
            //Find the absolute path of the shells directory
            const shellsDirectory = path.join(process.cwd(), '/helpers');
            //Exec the shell
            const { stderr } = await exec(
                `${shellsDirectory}/shells/deleteRepo.sh ${repoList[indexToDelete].repositoryName}`
            );
            if (stderr) {
                console.log('stderr:', stderr);
                res.status(500).json({
                    status: 500,
                    message: 'Error on delete, contact the administrator.',
                });
                return;
            }

            //Delete the repo in the repoList
            if (indexToDelete !== -1) {
                repoList.splice(indexToDelete, 1);
            } else {
                console.log('The index to delete does not existe (-1)');
                res.status(500).json({
                    status: 500,
                    message: 'API error, contact the administrator',
                });
                return;
            }

            //Stringify the repoList to write it into the json file.
            repoList = JSON.stringify(repoList);
            //Write the new json
            await fs.writeFile(
                jsonDirectory + '/repo.json',
                repoList,
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
                    message: 'API error, contact the administrator',
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
