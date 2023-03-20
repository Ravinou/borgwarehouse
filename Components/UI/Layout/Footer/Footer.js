//Lib
import classes from './Footer.module.css';

function Footer() {
    return (
        <div className={classes.footer}>
            <p>
                About{' '}
                <a
                    className={classes.site}
                    target='_blank'
                    href='https://borgwarehouse.com/'
                    rel='noreferrer'
                >
                    BorgWarehouse
                </a>
            </p>
        </div>
    );
}

export default Footer;
