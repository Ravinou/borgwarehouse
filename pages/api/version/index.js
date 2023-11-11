import packageInfo from '../../../package.json';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            res.status(200).json({ version: packageInfo.version });
            return;
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'API error, contact the administrator !',
            });
            return;
        }
    }
}
