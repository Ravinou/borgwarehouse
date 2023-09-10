FROM node:18-buster-slim

RUN apt-get update && \
    apt-get install -y curl git jq borgbackup openssh-server && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd borgwarehouse

RUN useradd -m -g borgwarehouse  borgwarehouse

WORKDIR /home/borgwarehouse/app

RUN git clone -b v2.0 https://github.com/Ravinou/borgwarehouse.git .

RUN chown -R borgwarehouse:borgwarehouse * .*

USER borgwarehouse

RUN npm ci --only=production

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["./docker-bw-init.sh"]

CMD ["npm", "run", "start"]
