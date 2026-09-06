FROM node:20-bookworm-slim

WORKDIR /workspace

COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm install

COPY backend ./backend

WORKDIR /workspace/backend
EXPOSE 3000
CMD ["npm", "run", "dev"]
