FROM node:20-alpine
WORKDIR /app

COPY . .
RUN npm install

WORKDIR /app/apps/backend
EXPOSE 4000
CMD ["npm", "run", "dev"]
