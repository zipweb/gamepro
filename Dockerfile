# Usa Node
FROM node:18

# Define pasta
WORKDIR /app

# Copia tudo
COPY . .

# Instala dependências (IGNORA npm ci)
RUN npm install --legacy-peer-deps

# Build frontend
RUN cd apps/frontend && npm run build || true

# Porta
EXPOSE 3000

# Start backend
CMD ["node", "apps/backend/src/main.js"]
