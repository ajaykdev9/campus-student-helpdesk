FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY frontend frontend
COPY backend backend
RUN npm run build
USER node
EXPOSE 3000
CMD ["node","backend/server.js"]
