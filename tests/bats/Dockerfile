FROM bash:latest

RUN apk add --no-cache bash bats git openssl borgbackup

COPY helpers/shells/ /test/scripts/
COPY tests/bats/createRepo.bats /test/tests/createRepo.bats

RUN chmod +x /test/scripts/*.sh

CMD ["bats", "/test/tests/"]
