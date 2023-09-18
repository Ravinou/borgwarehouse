FROM node:18

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    jc \
    borgbackup \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
