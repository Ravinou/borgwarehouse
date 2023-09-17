FROM node:18-bookworm-slim

RUN apt-get update && \
    apt-get install -y curl git jq borgbackup openssh-server && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd borgwarehouse

RUN useradd -m -g borgwarehouse  borgwarehouse

RUN cp /etc/ssh/sshd_config /etc/ssh/moduli /home/borgwarehouse/

WORKDIR /home/borgwarehouse/app

COPY . .

RUN chown -R borgwarehouse:borgwarehouse * .*

USER borgwarehouse

RUN npm ci --only=production

RUN npm run build

EXPOSE 3000 22

ENTRYPOINT ["./docker-bw-init.sh"]

CMD ["npm", "run", "start"]
