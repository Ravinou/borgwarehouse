//Lib
import 'react-toastify/dist/ReactToastify.css';
import classes from './UserSettings.module.css';

//Components
import EmailSettings from './EmailSettings/EmailSettings';
import PasswordSettings from './PasswordSettings/PasswordSettings';
import UsernameSettings from './UsernameSettings/UsernameSettings';
import EmailAlertSettings from './EmailAlertSettings/EmailAlertSettings';
import AppriseAlertSettings from './AppriseAlertSettings/AppriseAlertSettings';

export default function UserSettings(props) {
    return (
        <div className={classes.containerSettings}>
            <div>
                <h1 style={{ color: '#494b7a', textAlign: 'center' }}>
                    Welcome{' '}
                    {props.status === 'authenticated' && props.data.user.name}{' '}
                    👋
                </h1>
            </div>

            <PasswordSettings username={props.data.user.name} />
            <EmailSettings email={props.data.user.email} />
            <UsernameSettings username={props.data.user.name} />
            <EmailAlertSettings />
            <AppriseAlertSettings />
        </div>
    );
}
