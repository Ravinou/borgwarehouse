export default function emailTest(mailTo, username, aliasList) {
    const aliasTemplate = (x) => {
        let str = '';
        for (const alias of x) {
            str = str + '<li>' + alias + '</li>';
        }
        return str;
    };

    const template = {
        from: 'BorgWarehouse' + '<' + process.env.MAIL_SMTP_FROM + '>',
        to: mailTo,
        subject: 'Down status alert !',
        text: 'Some repositories need attention ! Please, check your BorgWarehouse interface.',
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

    <div style="padding: 20px; display: flex; flex-direction: column">
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
        <div style="margin: 30px auto 20px">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-alert-triangle"
                width="96"
                height="96"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                color="#6d4aff"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M12 9v2m0 4v.01"></path>
                <path
                    d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"
                ></path>
            </svg>
        </div>

        <div
            style="
                font-family: Inter, sans-serif;
                font-weight: 500;
                color: #494b7a;
                font-size: 1.5em;
                text-align: center;
                margin-bottom: 20px;
            "
        >
            <p>Some repositories need attention,<br /> ` +
            username +
            ` !</p>
        </div>

        <div
            style="
                font-family: Inter, sans-serif;
                color: #494b7a;
                font-size: 1.1em;
                margin-bottom: 50px;
            "
        >
            <p>
                List of repositories with down status :
            </p>
          <ul>` +
            aliasTemplate(aliasList) +
            `</ul>
          
        </div>

        <div
            style="
                margin: 2rem -0.5rem 0rem -0.5rem;
                color: #494b7a;
                background: #fff;
                border: 1px solid #6d4aff5c;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
                    0 1px 2px rgba(0, 0, 0, 0.24);
                border-radius: 5px;
                font-size: 0.8em;
                font-family: Inter, sans-serif;
                position: relative;
                padding: 1rem 1.5rem;
                display: flex;
            "
        >
            <div style="flex-shrink: 1 !important; margin-right: 0.75rem">
                🚩
            </div>
            <div style="width: 100%">
                Please remember that the status is based on
                <b>the last modification</b>. Backups are
                <b
                    >encrypted from end to end between your client and the
                    server</b
                >
                controlled by BorgWarehouse. Don't forget to
                <a
                    style="text-decoration: none; color: #6d4aff"
                    href="https://borgwarehouse.com/docs/user-manual/setupwizard/#step-3--launch--verify"
                    >check the integrity of your backups regularly</a
                >.
            </div>
        </div>
    </div>
    <div
        style="
            font-size: 0.8em;
            color: #c8c8c8;
            font-family: Inter, sans-serif;
            text-align: center;
        "
    >
        <p>
            About
            <a
                style="color: #cfc4fb; text-decoration: none"
                target="_blank"
                href="https://borgwarehouse.com/"
                >BorgWarehouse</a
            >
        </p>
    </div>
</div>
`,
    };
    return template;
}
