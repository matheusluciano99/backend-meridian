# 🏗️ Meridian Insurance - Backend

## 📋 Visão Geral

Backend da plataforma Meridian Insurance, uma solução de micro-seguros descentralizada construída com NestJS, integrada ao Stellar blockchain e Supabase. O sistema oferece APIs robustas para gerenciamento de produtos de seguro, políticas, sinistros e integração com contratos inteligentes Soroban.

## 🚀 Tecnologias

- **Framework**: NestJS 11.x
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **Blockchain**: Stellar + Soroban
- **Autenticação**: Supabase Auth
- **Deploy**: Railway

## 📁 Estrutura do Projeto

```
src/
├── anchors/           # Gerenciamento de âncoras Stellar
├── auth/             # Autenticação e autorização
├── chain-events/     # Eventos da blockchain
├── claims/           # Gerenciamento de sinistros
├── common/           # Utilitários compartilhados
├── ledger/           # Operações de ledger Stellar
├── micro/            # Micro-serviços
├── policies/         # Gerenciamento de políticas
├── products/         # Catálogo de produtos de seguro
├── soroban/          # Integração com contratos Soroban
├── users/            # Gerenciamento de usuários
└── webhooks/         # Webhooks para eventos externos
```

## 🛠️ Configuração e Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase
- Wallet Stellar configurada

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stellar
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your_stellar_secret_key
STELLAR_PUBLIC_KEY=your_stellar_public_key

# Soroban Contracts
POLICY_REGISTRY_CONTRACT_ID=your_policy_registry_contract_id
RISK_POOL_CONTRACT_ID=your_risk_pool_contract_id

# App
PORT=3000
NODE_ENV=development
```

### 3. Configuração do Banco de Dados

Execute as migrações do Supabase:

```bash
# Configurar Supabase localmente
npx supabase start

# Aplicar migrações
npx supabase db reset
```

## 🚀 Execução

### Desenvolvimento

```bash
# Modo desenvolvimento com hot-reload
npm run start:dev

# Modo debug
npm run start:debug
```

### Produção

```bash
# Build do projeto
npm run build

# Executar em produção
npm run start:prod
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📚 APIs Principais

### 🔐 Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de usuário
- `POST /auth/logout` - Logout

### 📦 Produtos
- `GET /products` - Listar produtos de seguro
- `GET /products/:id` - Detalhes do produto
- `POST /products` - Criar produto (admin)
- `PUT /products/:id` - Atualizar produto (admin)

### 📋 Políticas
- `GET /policies` - Listar políticas do usuário
- `POST /policies` - Criar nova política
- `GET /policies/:id` - Detalhes da política
- `PUT /policies/:id/activate` - Ativar política

### 🚨 Sinistros
- `GET /claims` - Listar sinistros
- `POST /claims` - Abrir sinistro
- `PUT /claims/:id/approve` - Aprovar sinistro (admin)
- `PUT /claims/:id/reject` - Rejeitar sinistro (admin)

### ⛓️ Blockchain
- `GET /soroban/balance/:address` - Saldo de XLM
- `POST /soroban/deploy` - Deploy de contrato
- `POST /soroban/invoke` - Invocar função do contrato

## 🔗 Integração com Blockchain

### Stellar Network
- **Testnet**: `https://soroban-testnet.stellar.org`
- **Mainnet**: `https://horizon.stellar.org`

### Contratos Soroban
- **PolicyRegistry**: Gerencia apólices de seguro
- **RiskPool**: Gerencia pool de risco e pagamentos

### Operações Principais
- Criação de políticas
- Coleta de prêmios
- Processamento de sinistros
- Pagamentos automáticos

## 🚀 Deploy

### Railway (Recomendado)

```bash
# Deploy automático via Railway
railway login
railway link
railway up
```

### Variáveis de Ambiente no Railway
Configure as seguintes variáveis no painel do Railway:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STELLAR_SECRET_KEY`
- `POLICY_REGISTRY_CONTRACT_ID`
- `RISK_POOL_CONTRACT_ID`

## 📊 Monitoramento

### Logs
- Logs estruturados com Winston
- Níveis: error, warn, info, debug
- Integração com Railway logs

### Métricas
- Health checks em `/health`
- Métricas de performance
- Monitoramento de contratos

## 🔧 Scripts Úteis

```bash
# Verificar deploy
npm run deploy:check

# Teste de deploy
npm run test:deploy

# Formatar código
npm run format

# Lint
npm run lint
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [docs.meridian-insurance.com](https://docs.meridian-insurance.com)
- **Issues**: [GitHub Issues](https://github.com/meridian-insurance/backend/issues)
- **Discord**: [Meridian Insurance Community](https://discord.gg/meridian-insurance)

---

**Desenvolvido com ❤️ pela equipe Meridian Insurance**