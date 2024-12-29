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
    text: 'Some repositories require your attention ! Please, check your BorgWarehouse interface.',
    html:
      `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Inter', sans-serif;
                    }
                    .container {
                        max-width: 475px;
                        margin: 40px auto;
                        border: 1px solid #eaeaea;
                        border-radius: 5px;
                        overflow: hidden;
                    }
                    .header {
                        border-top: 4px solid;
                        border-image-source: linear-gradient(90deg, #020024 0%, #6d4aff 50%, #020024 100%);
                        border-image-slice: 1;
                    }
                    .content {
                        padding: 20px;
                    }
                    .title {
                        color: #6d4aff;
                        font-weight: 700;
                        font-size: 2em;
                        text-align: center;
                        margin-top: 20px;
                    }
                    .icon {
                        display: block;
                        margin: 30px auto 20px;
                        text-align: center;
                    }
                    .message {
                        font-weight: 500;
                        color: #494b7a;
                        font-size: 1.5em;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .description {
                        color: #494b7a;
                        font-size: 1.1em;
                        margin-bottom: 50px;
                    }
                    .alert {
                        margin: 2rem -0.5rem 0rem -0.5rem;
                        color: #494b7a;
                        background: #fff;
                        border: 1px solid #6d4aff5c;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
                        border-radius: 5px;
                        font-size: 0.8em;
                        font-family: Inter, sans-serif;
                        padding: 1rem 1.5rem;
                        display: flex;
                    }
                    .footer {
                        font-size: 0.8em;
                        color: #C8C8C8;
                        text-align: center;
                    }
                    .footer a {
                        color: #cfc4fb;
                        text-decoration: none;
                    }
                    .alert a {
                        text-decoration: none;
                        color: #6d4aff;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"></div>
                    <div class="content">
                        <div class="title">BorgWarehouse</div>
                        <div class="icon">
                        <img src="cid:alert-icon" alt="alert icon" width="96" height="96">
                        </div>
                        <div class="message">
                            <p>Some repositories require your attention, ` +
      username +
      `!</p>
                        </div>
                        <div class="description">
                            <p>List of repositories with down status:</p>
                            <ul>` +
      aliasTemplate(aliasList) +
      `</ul>
                        </div>
                        <div class="alert">
                            <div style="flex-shrink: 1; margin-right: 0.75rem">🚩</div>
                            <div style="width: 100%">
                                Please remember that the status is based on <b>the last modification</b>. Backups are <b>encrypted from end to end between your client and the server</b> controlled by BorgWarehouse. Don't forget to <a href="https://borgwarehouse.com/docs/user-manual/setupwizard/#step-3--launch--verify" rel="noreferrer">check the integrity of your backups regularly</a>.
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>About <a href="https://borgwarehouse.com/" target="_blank" rel="noreferrer">BorgWarehouse</a></p>
                    </div>
                </div>
            </body>
            </html>
        `,
    attachments: [
      {
        path: 'helpers/templates/attachments/alert-icon.png',
        cid: 'alert-icon',
      },
    ],
  };
  return template;
}
