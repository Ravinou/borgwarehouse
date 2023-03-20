export default function emailTest(mailTo, username) {
    const template = {
        from: 'BorgWarehouse' + '<' + process.env.MAIL_SMTP_FROM + '>',
        to: mailTo,
        subject: 'Testing email settings',
        text: 'If you received this email then the mail configuration seems to be correct.',
        html:
            `
            <div
                style="
                    max-width: 37.5em;
                    border: 1px solid #eaeaea;
                    border-radius: 5px;
                    margin: 40px auto;
                    overflow: hidden;
                    max-width: 475px;
                "
                >
                <div
                        style="
                            border-image-slice: 1;
                            border-top: 4px solid;
                            border-image-source: linear-gradient(
                                90deg,
                                #020024 0%,
                                #6d4aff 50%,
                                #020024 100%
                            );
                        "
                ></div>
        
                <div style="padding: 20px; display: flex; flex-direction: column;">
                        <div
                            style="
                                color: #6d4aff;
                                font-family: Inter, sans-serif;
                                font-weight: 700;
                                font-size: 2em;
                                text-align: center;
                                margin-top: 20px;
                            "
                        >
                            BorgWarehouse
                        </div>
                        <div style="margin: 30px auto 20px;">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="96"
                                height="96"
                                viewBox="0 0 24 24"
                                stroke-width="1"
                                stroke="currentColor"
                                fill="none"
                                stroke-linecap="round"
                                color="#563acf"
                                stroke-linejoin="round"
                            >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M7 12l5 5l10 -10"></path>
                                <path d="M2 12l5 5m5 -5l5 -5"></path>
                            </svg>
                        </div>
                        
                        <div style="font-family: Inter, sans-serif; font-weight: 500; color: #494b7a;
                        font-size: 1.5em;
                        text-align: center; margin-bottom: 20px;"><p>Good job, ` +
            username +
            ` !</p></div>
            
                        <div style="font-family: Inter, sans-serif; color: #494b7a;
                        font-size: 1.1em;
                        text-align: center; margin-bottom: 50px;"><p>If you received this mail then the configuration seems to be correct.</p></div>
            
                        
                    </div>
                    <div style="font-size: 0.8em;color: #C8C8C8;font-family: Inter, sans-serif; text-align: center;"><p>About <a style="color:#cfc4fb; text-decoration: none;" target="_blank" href="https://borgwarehouse.com/" rel='noreferrer'>BorgWarehouse</a></p></div>
                </div>
            </div>
            `,
    };
    return template;
}
