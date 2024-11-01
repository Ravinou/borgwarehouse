FROM bash:latest

RUN apk add --no-cache \
    bats \ 
    openssl \
    borgbackup \
    jq \
    coreutils 

COPY helpers/shells/ /test/scripts/
COPY tests/bats/createRepo.bats /test/tests/createRepo.bats
COPY tests/bats/deleteRepo.bats /test/tests/deleteRepo.bats
COPY tests/bats/updateRepo.bats /test/tests/updateRepo.bats
COPY tests/bats/getLastSave.bats /test/tests/getLastSave.bats
COPY tests/bats/getStorageUsed.bats /test/tests/getStorageUsed.bats

RUN chmod +x /test/scripts/*.sh

CMD ["bats", "/test/tests/"]
