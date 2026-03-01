FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL="postgresql://motogestor_user:Brasil474744%40@postgres:5432/motogestor"

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]

