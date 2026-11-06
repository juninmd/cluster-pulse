FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY src/ ./src/
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "src/index.ts"]

# executa app sem privilegio (DS-0002)
RUN groupadd -g 10001 app && useradd -u 10001 -m -g app -s /bin/sh app
USER app
