FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./server.js
COPY public ./public

RUN mkdir -p /app/data/uploads /app/data/output

EXPOSE 3000
CMD ["npm", "start"]
