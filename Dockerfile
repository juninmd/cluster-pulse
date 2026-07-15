FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY src/ ./src/
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "src/index.ts"]
