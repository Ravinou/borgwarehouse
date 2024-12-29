export default function emailTest(mailTo, username) {
  const template = {
    from: 'BorgWarehouse' + '<' + process.env.MAIL_SMTP_FROM + '>',
    to: mailTo,
    subject: 'Testing email settings',
    text: 'If you received this email then the mail configuration seems to be correct.',
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
                        text-align: center;
                        margin-bottom: 50px;
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
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"></div>
                    <div class="content">
                        <div class="title">BorgWarehouse</div>
                        <div class="icon">
                        <img src="cid:valid-icon" alt="valid icon" width="96" height="96">
                        </div>
                        <div class="message">
                            <p>Good job, ` +
      username +
      `!</p>
                        </div>
                        <div class="description">
                            <p>If you received this mail then the configuration seems to be correct.</p>
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
        path: 'helpers/templates/attachments/valid-icon.png',
        cid: 'valid-icon',
      },
    ],
  };
  return template;
}
