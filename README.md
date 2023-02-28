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

## What is BorgWarehouse ?

**BorgWarehouse is a graphical interface to manage a central [BorgBackup](https://borgbackup.readthedocs.io/en/stable/#what-is-borgbackup) repository server.**

Today, if you want to have a large server on which you centralize backups of BorgBackup clients you have to do everything manually from the command line. It works, but in everyday life it can be complicated and adding, modifying, deleting repositories is always a bit long and tedious. If you want to do things right, you have to create a user on your server, associate him a public SSH key, give him a quota... in short **it's a bit of work**.

With BorgWarehouse, you have an interface that allows you to do all this simply and quickly :

-   **add** repositories
-   **edit** existing repositories
-   **delete** repositories
-   be **alerted** if there are no recent backups
-   **monitor** the volume of data
-   **flexibly manage quotas** for each repository
-   ...

The whole system part is automatically managed by BorgWarehouse and **you don't have to touch your terminal anymore** while enjoying a visual feedback on the status of your repositories.

## Get started

You can find the documentation here : <a href="https://borgwarehouse.com/docs/prologue/introduction/">https://borgwarehouse.com/</a>

## :key: Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file.

Required variables :

-   `NEXTAUTH_URL` : The url of your application as **https://borgwarehouse.com**.
-   `NEXTAUTH_SECRET` : A secret random key.
-   `CRONJOB_KEY` : A secret API key for cronjob.
-   `NEXT_PUBLIC_HOSTNAME` : FQDN as **borgwarehouse.com**
-   `NEXT_PUBLIC_SSH_SERVER_PORT` : SSH port of your server as **22**.
-   `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_RSA` : Your server SSH fingerprint for RSA.
-   `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ED25519` : Your server SSH fingerprint for ED25519.
-   `NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ECDSA` : Your server SSH fingerprint for ECDSA.

Example for a valid `.env.local` file :

```bash
# Private variable (Any change need a rebuild of app)
NEXTAUTH_URL=https://yourbwdomain.com
NEXTAUTH_SECRET=YOURFIRSTSECRET
CRONJOB_KEY=YOURSECONDSECRET
MAIL_SMTP_FROM=
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=
MAIL_SMTP_LOGIN=
MAIL_SMTP_PWD=
MAIL_REJECT_SELFSIGNED_TLS=true

# Public variable
NEXT_PUBLIC_HOSTNAME=yourbwdomain.com
NEXT_PUBLIC_SSH_SERVER_PORT=22
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_RSA=SHA256:36mfYNRrm1aconVt6cBpi8LhAoPP4kB8QsVW4n8eGHQ
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ED25519=SHA256:tYQuzrZZMqaw0Bzvn/sMoDs1CVEitZ9IrRyUg02yTPA
NEXT_PUBLIC_SSH_SERVER_FINGERPRINT_ECDSA=SHA256:nTpxui1oEmH9konPau17qBVIzBQVOsD1BIbBFU5IL04

# Disable NextJS telemetry
NEXT_TELEMETRY_DISABLED=1
```

You can find more details about generating your secrets or retrieving your SSH fingerprint. You can find more details about generating your secrets or retrieving your SSH fingerprint <a href="https://borgwarehouse.com/docs/admin-manual/debian-installation/#configure-application-environment-variables">in the documentation</a>.

## How to update ?

Check the online documentation [just here](https://borgwarehouse.com/docs/admin-manual/how-to-update/) !

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[next-url]: https://nextjs.org/
[react.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://reactjs.org/
