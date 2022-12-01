<div align="center">
  
  [![Next][Next.js]][Next-url]
  [![React][React.js]][React-url]

</div>

  <h3 align="center">BorgWarehouse</h3>

  <p align="center">
    A fast and modern WebUI for a BorgBackup's central repository server.
    <br />
    <a href="https://borgwarehouse.com"><strong>Explore the docs »</strong></a>
  </p>

<div align="center">
  <a href="https://borgwarehouse.com">
    <img src="medias/borgwarehouse-og.png" alt="presentation">
  </a>
</div>

### Get started

You can find the documentation here : <a href="https://borgwarehouse.com/docs/prologue/introduction/">https://borgwarehouse.com/</a>

### :key: Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file.

Variables to create (all required) :

- `NEXTAUTH_URL` : The url of your application as **https://borgwarehouse.com**.
- `NEXTAUTH_SECRET` : A secret random key.
- `CRONJOB_KEY` : A secret API key for cronjob.
- `NEXT_PUBLIC_HOSTNAME` : FQDN as **borgwarehouse.com**
- `NEXT_PUBLIC_SSH_SERVER_PORT` : SSH port of your server as **22**.
- `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_RSA` : Your server SSH fingerprint for RSA.
- `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ED25519` : Your server SSH fingerprint for ED25519.
- `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ECDSA` : Your server SSH fingerprint for ECDSA.

Example for a valid `.env.local` file :

```bash
NEXTAUTH_URL=https://yourbwdomain.com
NEXTAUTH_SECRET=YOURFIRSTSECRET
CRONJOB_KEY=YOURSECONDSECRET
NEXT_PUBLIC_HOSTNAME=yourbwdomain.com
NEXT_PUBLIC_SSH_SERVER_PORT=22
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_RSA=SHA256:36mfYNRrm1aconVt6cBpi8LhAoPP4kB8QsVW4n8eGHQ
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ED25519=SHA256:tYQuzrZZMqaw0Bzvn/sMoDs1CVEitZ9IrRyUg02yTPA
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ECDSA=SHA256:nTpxui1oEmH9konPau17qBVIzBQVOsD1BIbBFU5IL04
```

You can find more details about generating your secrets or retrieving your SSH fingerprint <a href="You can find more details about generating your secrets or retrieving your SSH fingerprint in the documentation.">in the documentation</a>.


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
