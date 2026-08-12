FROM node:22-alpine

WORKDIR /server

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./
RUN if [ "$NODE_ENV" = "production" ]; then npm ci --omit=dev; else npm install; fi

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else exec npm run dev; fi"]