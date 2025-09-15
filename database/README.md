# 🗄️ Database Schema - Meridian Insurance

Este diretório contém o schema do banco de dados para o sistema Meridian Insurance, desenvolvido para funcionar com Supabase.

## 📁 Estrutura dos Arquivos

```
database/
├── README.md                    # Este arquivo
├── schema.sql                   # Schema completo (referência)
├── rls_policies.sql            # Políticas de Row Level Security
└── 001_initial_schema.sql      # Migração inicial
```

## 🚀 Como Executar

### 1. **Executar no Supabase Dashboard**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Execute os arquivos na seguinte ordem:

```sql
-- 1. Primeiro, execute o schema inicial
-- Cole o conteúdo de: 001_initial_schema.sql

-- 2. Depois, execute as políticas RLS
-- Cole o conteúdo de: rls_policies.sql
```

### 2. **Executar via CLI (se configurado)**

```bash
# Se você tiver o Supabase CLI configurado
supabase db reset
supabase db push
```

## 📊 Estrutura do Banco

### **Tabelas Principais**

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `users` | Usuários do sistema | - |
| `products` | Produtos de seguro | - |
| `policies` | Apólices contratadas | users, products |
| `payments` | Pagamentos/transações | users, policies |
| `ledger` | Eventos financeiros | users, policies, payments |
| `claims` | Sinistros/reclamações | users, policies |
| `webhook_logs` | Logs de webhooks | - |

### **Campos Importantes**

#### **Users**
- `id`: UUID único
- `email`: Email único
- `wallet_address`: Endereço da carteira Stellar
- `kyc_status`: Status de verificação ('pending', 'verified', 'rejected')

#### **Policies**
- `policy_number`: Número único da apólice (gerado automaticamente)
- `status`: Status da apólice ('PAUSED', 'ACTIVE', 'CANCELLED', 'EXPIRED')
- `premium_amount`: Valor do prêmio
- `coverage_amount`: Valor da cobertura

#### **Payments**
- `status`: Status do pagamento ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
- `transaction_hash`: Hash da transação Stellar
- `anchor_transaction_id`: ID da transação no anchor

## 🔒 Segurança (RLS)

O sistema implementa **Row Level Security** com as seguintes políticas:

- **Usuários** podem ver apenas seus próprios dados
- **Produtos** são públicos para leitura
- **Apólices** são visíveis apenas para o proprietário
- **Pagamentos** são privados por usuário
- **Sinistros** são privados por usuário
- **Administradores** têm acesso total (quando configurado)

## 🔧 Configuração do .env

Certifique-se de que seu arquivo `.env` contém:

```env
SUPABASE_URL=https://ruhuqufxtoeqgjiqgcii.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aHVxdWZ4dG9lcWdqaXFnY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg5OTIsImV4cCI6MjA3MzUyNDk5Mn0.ElxJsxUTs8_Yx23AaIyWf6iHUR0TxQCtlQr-LjVL16Q
```

## 📝 Exemplos de Uso

### **Criar um usuário**
```sql
INSERT INTO users (email, name, wallet_address) 
VALUES ('user@example.com', 'João Silva', 'GABC123...');
```

### **Criar uma apólice**
```sql
INSERT INTO policies (user_id, product_id, policy_number, premium_amount, coverage_amount)
VALUES (
    'user-uuid-here',
    'product-uuid-here', 
    generate_policy_number(),
    300.00,
    5000.00
);
```

### **Registrar um pagamento**
```sql
INSERT INTO payments (user_id, user_wallet, amount, status)
VALUES (
    'user-uuid-here',
    'GABC123...',
    300.00,
    'PENDING'
);
```

## 🔍 Queries Úteis

### **Buscar apólices de um usuário**
```sql
SELECT p.*, pr.name as product_name
FROM policies p
JOIN products pr ON p.product_id = pr.id
WHERE p.user_id = 'user-uuid-here';
```

### **Histórico de pagamentos**
```sql
SELECT * FROM payments 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### **Eventos do ledger**
```sql
SELECT * FROM ledger 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### **Erro de RLS**
Se você receber erros de RLS, verifique:
1. Se o usuário está autenticado
2. Se as políticas RLS estão ativas
3. Se o usuário tem permissão para acessar os dados

### **Erro de Foreign Key**
Verifique se:
1. Os UUIDs existem nas tabelas referenciadas
2. As tabelas foram criadas na ordem correta
3. Os relacionamentos estão corretos

### **Erro de Permissão**
Para operações administrativas:
1. Verifique se o usuário tem `kyc_status = 'verified'`
2. Implemente a lógica de admin na função `is_admin()`

## 📚 Próximos Passos

1. **Configurar autenticação** no Supabase
2. **Implementar funções de admin** na função `is_admin()`
3. **Configurar webhooks** para atualizações automáticas
4. **Implementar backup** e monitoramento
5. **Adicionar mais produtos** conforme necessário

## 🤝 Suporte

Para dúvidas sobre o schema:
1. Verifique os comentários nas tabelas
2. Consulte a documentação do Supabase
3. Teste as queries no SQL Editor do Supabase
