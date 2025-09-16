# 🚀 Deploy no Railway - MERIDIAN INSURANCE

## 📋 Checklist Pré-Deploy

- [ ] Build local funcionando (`npm run build`)
- [ ] Testes passando (`npm run test`)
- [ ] Variáveis de ambiente configuradas
- [ ] Contratos Stellar deployados
- [ ] Banco de dados acessível

## 🛠️ Comandos de Deploy

```bash
# 1. Verificar configurações
npm run deploy:check

# 2. Build local (opcional)
npm run build

# 3. Deploy via Railway CLI
railway up

# 4. Verificar logs
railway logs
```

## 🔧 Configuração no Railway

### 1. Conectar Repositório
- Acesse [railway.app](https://railway.app)
- "New Project" → "Deploy from GitHub repo"
- Selecione: `backend/backend-meridian`

### 2. Variáveis de Ambiente
Configure no dashboard do Railway:

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stellar
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Smart Contracts
POLICY_REGISTRY_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3I3A
RISK_POOL_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3I3A
SIGNER_PRIVATE_KEY=S...

# Server
NODE_ENV=production
FRONTEND_URL=https://meridian-insurance.vercel.app
```

## 📊 Monitoramento

### Health Check
- **Endpoint**: `GET /`
- **Status**: 200 OK
- **Response**: `{"status": "ok", "timestamp": "..."}`

### Logs Importantes
```bash
# Ver logs em tempo real
railway logs --follow

# Filtrar por nível
railway logs --filter "error"
```

### Métricas
- **CPU**: < 80%
- **Memória**: < 512MB
- **Uptime**: 99.9%

## 🚨 Troubleshooting

### Erro: Build Failed
```bash
# Verificar Node.js version
node --version  # Deve ser >= 18

# Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Erro: Database Connection
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
railway run npm run test
```

### Erro: Stellar Connection
```bash
# Verificar variáveis Stellar
railway variables

# Testar RPC
curl https://soroban-testnet.stellar.org
```

### Erro: CORS
- Verificar `FRONTEND_URL` está configurada
- Confirmar URL do frontend está correta
- Verificar se frontend está deployado

## 🔄 Deploy Automático

### GitHub Actions (Opcional)
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend/backend-meridian && npm ci
      - run: cd backend/backend-meridian && npm run build
      - uses: railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 📈 Performance

### Otimizações Implementadas
- **Compressão**: Gzip habilitado
- **CORS**: Configurado para produção
- **Health Check**: Endpoint otimizado
- **Logs**: Estruturados para monitoramento

### Benchmarks Esperados
- **Startup**: < 10s
- **Response Time**: < 200ms
- **Throughput**: 100+ req/s

## 🔐 Segurança

### Variáveis Sensíveis
- ✅ `SIGNER_PRIVATE_KEY` - Criptografada
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Criptografada
- ✅ `DATABASE_URL` - Criptografada

### Headers de Segurança
- ✅ CORS configurado
- ✅ Content-Type validation
- ✅ Rate limiting (futuro)

## 📞 Suporte

### Logs de Debug
```bash
# Nível de log detalhado
railway variables set LOG_LEVEL=debug

# Ver logs específicos
railway logs --filter "soroban"
railway logs --filter "database"
```

### Contatos
- **Railway Support**: [docs.railway.app](https://docs.railway.app)
- **Stellar Docs**: [developers.stellar.org](https://developers.stellar.org)
- **NestJS Docs**: [docs.nestjs.com](https://docs.nestjs.com)

---

## ✅ Deploy Checklist Final

- [ ] ✅ Build local funcionando
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Deploy realizado com sucesso
- [ ] ✅ Health check respondendo
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ Frontend conectando ao backend
- [ ] ✅ Testes de integração passando

**🎉 Deploy concluído com sucesso!**
