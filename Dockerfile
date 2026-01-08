FROM oven/bun:slim as base

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Taipei /etc/localtime && \
    echo "Asia/Taipei" > /etc/timezone

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

CMD ["bun", "run", "start"]