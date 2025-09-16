# Etapa 1: Build
FROM node:18 AS builder

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e lock para cache eficiente
COPY package*.json ./

# Instalar dependências (inclui dev para o build)
RUN npm install

# Copiar código-fonte
COPY . .

# Rodar build do NestJS (gera dist/)
RUN npm run build


# Etapa 2: Runtime
FROM node:18 AS runner

WORKDIR /app

# Copiar package.json e lock novamente
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install --omit=dev

# Copiar build da etapa anterior
COPY --from=builder /app/dist ./dist

# Se você tiver outros arquivos necessários (como .env.prod, migrations, etc.), copie aqui também:
# COPY .env.prod ./

# Expor porta (Nest padrão é 3000)
EXPOSE 8000

# Comando de start em produção
CMD ["node", "dist/main.js"]
