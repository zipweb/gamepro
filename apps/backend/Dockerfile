FROM node:18

WORKDIR /app

COPY . .

RUN npm install

# Prisma apontando pro schema correto
RUN npx prisma generate --schema=database/prisma/schema.prisma

# Rodar migrations no banco Railway
RUN npx prisma migrate deploy --schema=database/prisma/schema.prisma

# Start backend
CMD ["node", "apps/backend/src/main.js"]
