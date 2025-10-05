# MANUAL DO ADMINISTRADOR - REPRESENTATIVES PWA v3.0

**Versão:** 3.0.0  
**Data:** 05/10/2025  
**Público:** Administradores do Sistema  
**Nível:** Técnico/Gerencial

---

## VISÃO GERAL

Este manual destina-se a administradores responsáveis pelo gerenciamento de licenças, usuários e configurações do Representatives PWA. Você terá acesso ao painel administrativo para controlar todo o sistema de licenciamento.

### O QUE VOCÊ PODE FAZER

- Criar e gerenciar licenças
- Revogar acessos
- Visualizar estatísticas do sistema
- Monitorar dispositivos ativos
- Configurar políticas de segurança
- Gerar relatórios de uso

---

## ACESSO AO PAINEL ADMIN

### URL DE ACESSO

**Produção:** https://representatives-pwa-933i.vercel.app/admin/login  
**Desenvolvimento:** http://localhost:3000/admin/login

### AUTENTICAÇÃO

#### Primeiro Login

1. **Acesse a URL de login**
   ```
   /admin/login
   ```

2. **Credenciais**
   - Senha configurada na variável `ADMIN_PASSWORD` (.env)
   - Padrão: Veja o arquivo .env do sistema

3. **Token JWT**
   - Válido por 24 horas
   - Armazenado em cookie httpOnly (seguro)
   - Renovação automática a cada login

4. **Acesso liberado**
   - Redirecionamento automático para `/admin`
   - Menu de navegação disponível

#### Segurança

- Cookie httpOnly (não acessível via JavaScript)
- SameSite: strict (proteção CSRF)
- HTTPS obrigatório em produção
- Sessão expira em 24h
- Logout limpa o cookie

#### Alterar Senha

Para alterar a senha de admin:

1. Acesse o servidor/ambiente de produção
2. Edite a variável de ambiente:
   ```bash
   ADMIN_PASSWORD="nova-senha-segura"
   ```
3. Reinicie a aplicação
4. Use a nova senha no próximo login

**Importante:** Use senhas fortes com:
- Mínimo 12 caracteres
- Letras maiúsculas e minúsculas
- Números e símbolos
- Exemplo: `Admin@2025!Secure#`

---

## PAINEL ADMINISTRATIVO

### Dashboard Principal

**URL:** `/admin`

#### KPIs em Tempo Real

**Métricas Exibidas:**

1. **Total de Licenças**
   - Contagem geral de todas as licenças criadas
   - Atualização em tempo real do banco

2. **Licenças Ativas**
   - Licenças com status "active"
   - Não expiradas
   - Em uso atual

3. **Licenças Expiradas**
   - Licenças que passaram da data de expiração
   - Necessitam renovação
   - Status "expired"

4. **Licenças Revogadas**
   - Licenças canceladas manualmente
   - Status "revoked"
   - Devices automaticamente bloqueados

5. **Dispositivos Ativos**
   - Total de dispositivos conectados
   - Status "active" em LicenseDevice
   - Em uso no momento

#### Gráficos Interativos

**Licenças por Tipo:**
- Gráfico de barras horizontal
- Mostra distribuição: Trial, Standard, Premium, Enterprise, Gift
- Cores distintas por tipo

**Status das Licenças:**
- Gráfico de barras horizontal
- Distribuição: Ativas, Expiradas, Revogadas
- Indicador visual de saúde do sistema

#### Últimas Licenças Criadas

Tabela com as 5 licenças mais recentes:
- Chave de licença
- Tipo
- Status
- Emitida para
- Data de criação

**Navegação:**
- Botão "Ver Todas as Licenças" leva para `/admin/licenses`

---

## GERENCIAMENTO DE LICENÇAS

### Lista de Licenças

**URL:** `/admin/licenses`

#### Visualização Completa

**Informações Exibidas:**
- Chave de licença (completa)
- Tipo (badge colorido)
- Status (badge colorido)
- Emitida para
- Empresa (se preenchido)
- Data de expiração
- Máximo de usuários
- Dispositivos ativos/total
- Ações disponíveis

**Cores dos Badges:**

**Tipos:**
- Trial: Azul (`bg-blue-100 text-blue-800`)
- Standard: Verde (`bg-green-100 text-green-800`)
- Premium: Roxo (`bg-purple-100 text-purple-800`)
- Enterprise: Roxo Escuro (`bg-indigo-100 text-indigo-800`)
- Gift: Rosa (`bg-pink-100 text-pink-800`)

**Status:**
- Ativa: Verde (`bg-green-100 text-green-800`)
- Expirada: Amarelo (`bg-yellow-100 text-yellow-800`)
- Revogada: Vermelho (`bg-red-100 text-red-800`)

#### Filtros Avançados

**Busca por Texto:**
- Campo de busca no topo
- Busca em: chave, issuedTo, companyName
- Busca em tempo real (sem delay)
- Case-insensitive

**Filtro por Status:**
- Dropdown: "Todos", "Ativa", "Expirada", "Revogada"
- Filtra instantaneamente
- Combinável com busca

**Filtro por Tipo:**
- Dropdown: "Todos", "Trial", "Standard", "Premium", "Enterprise", "Gift"
- Filtra instantaneamente
- Combinável com busca e status

**Exemplo de Uso:**
```
Busca: "VIAL"
Status: "Ativa"
Tipo: "Enterprise"
```
Resultado: Todas as licenças Enterprise ativas para VIAL

#### Estatísticas no Topo

Cards com contadores:
- Total de Licenças
- Licenças Ativas
- Licenças Revogadas
- Dispositivos Ativos (total)

---

## CRIAR NOVA LICENÇA

### Processo Passo a Passo

#### 1. Abrir Modal

**Como:**
- Botão "Nova Licença" no topo da lista
- Ou atalho: Botão no dashboard

**Interface:**
- Modal centralizado
- Formulário completo
- Validação em tempo real

#### 2. Selecionar Tipo

**Dropdown com 5 opções:**

**Trial (Teste Grátis):**
- Duração: 90 dias automaticamente
- Max Users: 1
- Features: Basic, Clients, Receivables
- Uso: Testes e demonstrações

**Standard (Padrão):**
- Duração: 1 ano (365 dias)
- Max Users: 5
- Features: Basic, Clients, Receivables, Goals, Reports
- Uso: Pequenos times

**Premium:**
- Duração: 1 ano (365 dias)
- Max Users: 10
- Features: Standard + Analytics
- Uso: Times médios com análises

**Enterprise (Empresa):**
- Duração: Vitalícia (sem expiração)
- Max Users: 999 (ilimitado)
- Features: Todas
- Uso: Grandes empresas

**Gift (Doação):**
- Duração: Vitalícia (sem expiração)
- Max Users: 1
- Features: Todas
- Uso: Doações individuais, prêmios

**Importante:** Ao selecionar o tipo, os campos são preenchidos automaticamente com valores padrão.

#### 3. Preencher Dados

**Campos do Formulário:**

**Emitida Para:** (opcional)
- Nome da pessoa ou entidade
- Exemplo: "João Silva" ou "Empresa XYZ"
- Máximo 100 caracteres

**Empresa:** (opcional)
- Nome da empresa/organização
- Exemplo: "ACME Corporation"
- Máximo 100 caracteres

**Máximo de Usuários:** (obrigatório)
- Número inteiro positivo
- Padrão: Baseado no tipo
- Mínimo: 1

**Data de Expiração:** (obrigatório)
- Formato: YYYY-MM-DD
- Ou: "lifetime" para vitalícia
- Trial: +90 dias automático
- Standard/Premium: +365 dias automático
- Enterprise/Gift: Vitalícia automático

**Validações:**
- Max Users > 0
- Data válida (se não vitalícia)
- Todos os campos verificados antes de salvar

#### 4. Geração de Chave

**Processo Automático:**

1. Sistema gera chave única
2. Formato: `TIPO-2025-XXXX-YYYY`
3. Prefixos por tipo:
   - Trial: `TRIL-2025-...`
   - Standard: `STND-2025-...`
   - Premium: `PREM-2025-...`
   - Enterprise: `ENTP-2025-...`
   - Gift: `GIFT-2025-...`

4. Verificação de unicidade
   - Máximo 100 tentativas
   - Garante chave única no banco

**Exemplo de Chaves:**
```
TRIL-2025-A1B2-3C4D
STND-2025-X9Y8-Z7W6
PREM-2025-M5N4-P3Q2
ENTP-2025-VIAL-0001
GIFT-2025-DONA-5678
```

#### 5. Confirmação

**Modal de Sucesso:**

Exibe após criação:
- Chave gerada (completa)
- Botão "Copiar Chave"
- Status de criação
- Próximos passos

**Próximos Passos Sugeridos:**
1. Copie a chave
2. Envie para o usuário
3. Instrua sobre ativação em `/license`
4. Acompanhe ativação no painel

**Importante:** Guarde a chave em local seguro. Não é possível recuperá-la depois (mas pode ver no painel).

---

## REVOGAR LICENÇA

### Quando Revogar

**Motivos Comuns:**
- Término de contrato
- Violação de termos de uso
- Solicitação do cliente
- Licença comprometida
- Uso indevido detectado

### Processo de Revogação

#### 1. Localizar Licença

Use os filtros para encontrar:
- Busque pela chave
- Ou pelo nome do usuário/empresa
- Verifique se é a licença correta

#### 2. Iniciar Revogação

**Como:**
- Botão "Revogar" na linha da licença
- Cor vermelha (atenção)

#### 3. Confirmação

**Aviso Exibido:**
```
Tem certeza que deseja revogar esta licença?

Esta ação irá:
- Alterar status para "revoked"
- Bloquear todos os dispositivos associados
- Impedir novos acessos imediatamente

Esta ação não pode ser desfeita.

[Cancelar] [Confirmar Revogação]
```

**Importante:** Leia atentamente antes de confirmar.

#### 4. Resultado

**Feedback do Sistema:**
```
Licença revogada com sucesso!
X dispositivo(s) bloqueado(s).
```

**O que acontece:**
1. Status da licença: `active` → `revoked`
2. Todos os devices: `active` → `blocked`
3. Usuário perde acesso imediatamente
4. Dados preservados (não deletados)

### Reverter Revogação

Atualmente não é possível reverter uma revogação pela interface. Alternativas:

**Opção 1:** Criar nova licença para o usuário
- Mais simples
- Chave diferente
- Reativa imediatamente

**Opção 2:** Atualizar banco manualmente (avançado)
- Acesso direto ao PostgreSQL
- Alterar status: `revoked` → `active`
- Alterar devices: `blocked` → `active`

---

## EDITAR LICENÇA

### Campos Editáveis

**Via API PUT /api/admin/licenses/[id]:**

- Emitida Para (issuedTo)
- Empresa (companyName)
- Máximo de Usuários (maxUsers)
- Data de Expiração (expiryDate)
- Features (features array)

**Não Editável:**
- Chave de licença
- Tipo
- Data de criação
- ID do banco

### Como Editar (via API)

```typescript
// Exemplo de requisição
PUT /api/admin/licenses/cm2abc123

Body:
{
  "issuedTo": "Novo Nome",
  "companyName": "Nova Empresa",
  "maxUsers": 20,
  "expiryDate": "2026-12-31"
}

Response:
{
  "success": true,
  "data": { /* licença atualizada */ }
}
```

**Nota:** Interface web para edição em desenvolvimento. Use API diretamente por enquanto.

---

## MONITORAMENTO DE DISPOSITIVOS

### Rastreamento Automático

Cada licença rastreia:
- Dispositivos conectados
- Fingerprint do hardware
- Histórico de fingerprints
- Primeiro e último acesso
- Status (active/blocked)

### Informações de Device

**Na lista de licenças:**
- Contador: "X/Y dispositivos" (ativos/total)
- Clique na licença para ver detalhes

**Device ID:**
- Gerado do hardware (canvas, CPU, screen)
- Único por computador
- Não muda com atualizações de software

**Fingerprint:**
- Browser name, version, plugins
- Pode mudar com atualizações
- Tolerância de 90% (configurável)

### Políticas de Dispositivo

**Configuráveis via .env:**

```bash
LICENSE_FP_TOLERANCE=0.90    # 90% similaridade
LICENSE_GRACE_DAYS=3         # 3 dias de graça
```

**Tolerância (FP_TOLERANCE):**
- 0.90 = 90% de similaridade aceita
- Permite atualizações de browser
- Flexibilidade para mudanças menores

**Grace Period (GRACE_DAYS):**
- Dias de tolerância após expiração
- Usuário recebe avisos
- Acesso mantido temporariamente

---

## CONFIGURAÇÕES DO SISTEMA

### Variáveis de Ambiente

**Arquivo:** `.env`

#### Banco de Dados

```bash
# PostgreSQL (Neon)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"
```

#### Licenciamento

```bash
# Políticas de Licença
LICENSE_FP_TOLERANCE=0.90     # Tolerância fingerprint (0.0-1.0)
LICENSE_GRACE_DAYS=3          # Dias de graça pós-expiração
LICENSE_ALLOW_TRIAL=false     # Permitir criação de trials
LICENSE_TRIAL_DAYS=90         # Duração do trial (se habilitado)
```

**Explicação:**

**LICENSE_FP_TOLERANCE:**
- Controla similaridade de fingerprint
- 0.90 = 90% de match necessário
- Maior = mais flexível
- Menor = mais restritivo

**LICENSE_GRACE_DAYS:**
- Dias após expiração
- Usuário recebe avisos
- Sistema ainda funciona
- Após grace period: bloqueio

**LICENSE_ALLOW_TRIAL:**
- `true`: Usuários podem criar trials
- `false`: Apenas admin cria licenças
- Recomendado: `false` (controle total)

**LICENSE_TRIAL_DAYS:**
- Duração padrão do trial
- Recomendado: 90 dias
- Usado se ALLOW_TRIAL=true

#### Autenticação Admin

```bash
# Admin Auth
ADMIN_PASSWORD="sua-senha-segura-aqui"
JWT_SECRET="chave-longa-aleatoria-para-jwt"
```

**ADMIN_PASSWORD:**
- Senha para login admin
- Mínimo 12 caracteres
- Use caracteres especiais
- Exemplo: `Admin@2025!Secure#`

**JWT_SECRET:**
- Chave para assinar tokens
- Mínimo 32 caracteres aleatórios
- Nunca compartilhe
- Regenere se comprometido

#### Next.js

```bash
# Flags
NEXT_PUBLIC_DEMO=false        # Demo desabilitado
```

### Alterar Configurações

1. **Edite o arquivo .env**
   ```bash
   nano .env
   # ou
   vim .env
   ```

2. **Salve as alterações**

3. **Reinicie a aplicação**
   ```bash
   # Desenvolvimento
   npm run dev

   # Produção
   npm run build
   npm run start
   ```

4. **Verifique se funcionou**
   - Teste login (se alterou senha)
   - Teste políticas (se alterou licenciamento)

---

## BACKUP E RECUPERAÇÃO

### Backup do Banco de Dados

**Neon PostgreSQL:**
- Backup automático diário
- Retention de 7 dias (plano free)
- Retention maior em planos pagos

**Como fazer backup manual:**

1. **Via Neon Dashboard:**
   - Acesse console.neon.tech
   - Vá em seu projeto
   - Tab "Backups"
   - "Create Backup"

2. **Via pg_dump (local):**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

### Restaurar Backup

**Via Neon Dashboard:**
1. Console → Backups
2. Selecione o backup
3. "Restore"
4. Confirme

**Via pg_restore (local):**
```bash
psql $DATABASE_URL < backup_20251005.sql
```

### Backup de Licenças

O sistema possui backup integrado:
- Usuários podem fazer backup via interface
- Snapshots salvos em `LicenseBackup`
- Contém: licença + devices + configurações
- Restaurável pela API

**Como ver backups:**
```sql
SELECT * FROM "LicenseBackup" 
WHERE "licenseId" = 'cm2abc123'
ORDER BY "createdAt" DESC;
```

---

## RELATÓRIOS E ANALYTICS

### Dados Disponíveis

**Via Dashboard:**
- Total de licenças por tipo
- Status atual de todas as licenças
- Dispositivos ativos totais
- Últimas licenças criadas

**Via Banco de Dados:**

**Query: Licenças expiradas este mês**
```sql
SELECT * FROM "License"
WHERE status = 'expired'
  AND "expiryDate" >= date_trunc('month', CURRENT_DATE)
  AND "expiryDate" < date_trunc('month', CURRENT_DATE) + interval '1 month';
```

**Query: Dispositivos por licença**
```sql
SELECT 
  l."licenseKey",
  l."type",
  COUNT(d.id) as total_devices,
  COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_devices
FROM "License" l
LEFT JOIN "LicenseDevice" d ON l.id = d."licenseId"
GROUP BY l.id
ORDER BY total_devices DESC;
```

**Query: Uso por tipo**
```sql
SELECT 
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM "License"
GROUP BY type;
```

### Exportar Dados

**Via Prisma Studio:**
1. Execute: `npx prisma studio`
2. Navegue até a tabela
3. Exporte como CSV/JSON

**Via SQL:**
```bash
psql $DATABASE_URL -c "COPY (SELECT * FROM \"License\") TO STDOUT CSV HEADER" > licenses.csv
```

---

## SOLUÇÃO DE PROBLEMAS

### Não Consigo Fazer Login

**Verificações:**

1. **Senha correta?**
   - Verifique .env
   - Confirme ADMIN_PASSWORD

2. **JWT_SECRET configurado?**
   - Deve existir no .env
   - Mínimo 32 caracteres

3. **Banco acessível?**
   - Teste conexão
   - Verifique DATABASE_URL

4. **Cookies habilitados?**
   - Navegador deve aceitar cookies
   - Sem modo incógnito restritivo

**Solução:**
```bash
# Verifique variáveis
echo $ADMIN_PASSWORD
echo $JWT_SECRET

# Teste banco
npx prisma studio
```

### Licença Não Aparece na Lista

**Causas Comuns:**

1. **Filtros ativos**
   - Limpe busca
   - Selecione "Todos" nos dropdowns

2. **Não foi criada**
   - Verifique erros no console
   - Tente criar novamente

3. **Banco dessincronizado**
   - Recarregue a página (F5)
   - Limpe cache

**Verificação Manual:**
```bash
# Prisma Studio
npx prisma studio

# Ou SQL direto
psql $DATABASE_URL -c "SELECT * FROM \"License\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

### Erro ao Criar Licença

**Mensagens Comuns:**

**"Falha ao gerar chave única"**
- 100 tentativas esgotadas
- Improvável, mas possível
- Tente novamente

**"Max users deve ser positivo"**
- Corrija o valor
- Mínimo: 1

**"Data de expiração inválida"**
- Use formato YYYY-MM-DD
- Ou: "lifetime"

**"Não autorizado"**
- Sessão expirou
- Faça login novamente

### Revogação Não Funcionou

**Verificações:**

1. **Confirmou a ação?**
   - Modal de confirmação
   - Botão correto clicado

2. **Erro no console?**
   - Abra DevTools (F12)
   - Veja mensagens de erro

3. **Licença já revogada?**
   - Status atual "revoked"
   - Não pode revogar duas vezes

**Verificação Manual:**
```sql
-- Ver status atual
SELECT id, "licenseKey", status 
FROM "License" 
WHERE id = 'cm2abc123';

-- Revogar manualmente se necessário
UPDATE "License" 
SET status = 'revoked' 
WHERE id = 'cm2abc123';

UPDATE "LicenseDevice" 
SET status = 'blocked' 
WHERE "licenseId" = 'cm2abc123';
```

### Dispositivos Não Aparecem

**Causa:** Usuário não ativou a licença ainda

**Solução:**
1. Instrua usuário a acessar `/license`
2. Ativar com a chave fornecida
3. Aguardar alguns segundos
4. Recarregar painel admin

**Verificação:**
```sql
SELECT * FROM "LicenseDevice"
WHERE "licenseId" = 'cm2abc123';
```

---

## SEGURANÇA E MELHORES PRÁTICAS

### Proteção de Credenciais

**Nunca:**
- Compartilhe ADMIN_PASSWORD
- Exponha JWT_SECRET
- Commite .env no Git
- Use senhas fracas

**Sempre:**
- Use .env.example como template
- Senhas fortes (12+ caracteres)
- Rotacione senhas periodicamente
- Mantenha JWT_SECRET secreto

### Gestão de Licenças

**Recomendações:**

1. **Documentação:**
   - Anote quem recebeu cada licença
   - Mantenha planilha de controle
   - Registre datas de criação/renovação

2. **Renovações:**
   - Avise usuários 30 dias antes
   - Crie nova licença antes de expirar
   - Revogue a antiga após migração

3. **Revogações:**
   - Sempre confirme antes de revogar
   - Notifique o usuário
   - Documente o motivo

4. **Monitoramento:**
   - Revise dashboard semanalmente
   - Verifique licenças expiradas
   - Acompanhe dispositivos suspeitos

### Auditoria

**Logs Importantes:**

1. **Criações de Licença:**
   - Quem criou (admin sempre)
   - Quando (createdAt)
   - Para quem (issuedTo)

2. **Revogações:**
   - Data de revogação (updatedAt)
   - Status change: active → revoked

3. **Ativações:**
   - Device criado (firstSeenAt)
   - Fingerprint inicial

**Como acessar:**
```sql
-- Auditoria de criação
SELECT "licenseKey", "issuedTo", "createdAt"
FROM "License"
ORDER BY "createdAt" DESC;

-- Auditoria de revogações
SELECT "licenseKey", status, "updatedAt"
FROM "License"
WHERE status = 'revoked'
ORDER BY "updatedAt" DESC;

-- Auditoria de ativações
SELECT l."licenseKey", d."deviceId", d."firstSeenAt"
FROM "LicenseDevice" d
JOIN "License" l ON d."licenseId" = l.id
ORDER BY d."firstSeenAt" DESC;
```

### Conformidade

**LGPD/GDPR:**
- Dados de usuários armazenados: nome, empresa
- Device fingerprint é técnico (não pessoal)
- Usuários podem solicitar exclusão
- Mantenha política de privacidade atualizada

**Como deletar dados de usuário:**
```sql
-- Deletar licença e dados relacionados
DELETE FROM "License" WHERE id = 'cm2abc123';
-- (Devices deletados automaticamente via CASCADE)
```

---

## APIS ADMIN (REFERÊNCIA TÉCNICA)

### Autenticação

**POST /api/admin/auth/login**
```typescript
Body: { "password": "senha-admin" }
Response: { "success": true, "data": { "message": "Login bem-sucedido" } }
Cookie: auth_token (httpOnly, 24h)
```

**POST /api/admin/auth/logout**
```typescript
Response: { "success": true, "data": { "message": "Logout bem-sucedido" } }
Cookie: Removido
```

**GET /api/admin/auth/check**
```typescript
Response: { "success": true, "data": { "authenticated": true } }
```

### Gestão de Licenças

**GET /api/admin/licenses**
```typescript
Query Params:
  - status?: 'active' | 'expired' | 'revoked'
  - type?: 'trial' | 'standard' | 'premium' | 'enterprise' | 'gift'
  - search?: string

Response: { 
  "success": true, 
  "data": [
    {
      "id": "cm2abc123",
      "licenseKey": "ENTP-2025-VIAL-0001",
      "type": "enterprise",
      "status": "active",
      "issuedTo": "VIAL",
      "companyName": "VIAL Development",
      "expiryDate": null,
      "isLifetime": true,
      "maxUsers": 999,
      "features": ["all"],
      "activeDevices": 1,
      "totalDevices": 1,
      "devices": [...]
    }
  ]
}
```

**POST /api/admin/licenses**
```typescript
Body: {
  "type": "enterprise",
  "issuedTo": "João Silva",
  "companyName": "ACME Corp",
  "maxUsers": 999,
  "expiryDate": "lifetime"
}

Response: {
  "success": true,
  "data": {
    "id": "cm2xyz789",
    "licenseKey": "ENTP-2025-ACME-0002",  // Gerado automaticamente
    "type": "enterprise",
    "status": "active",
    ...
  }
}
```

**PUT /api/admin/licenses/[id]**
```typescript
Body: {
  "issuedTo": "Novo Nome",
  "maxUsers": 20
}

Response: { "success": true, "data": { /* licença atualizada */ } }
```

**DELETE /api/admin/licenses/[id]**
```typescript
Response: {
  "success": true,
  "data": {
    "message": "Licença revogada com sucesso",
    "blockedDevices": 2
  }
}
```

### Códigos de Erro

- **400:** Validação falhou (dados inválidos)
- **401:** Não autenticado (faça login)
- **404:** Licença não encontrada
- **409:** Conflito (chave duplicada)
- **500:** Erro interno do servidor

---

## MANUTENÇÃO E UPDATES

### Atualizar o Sistema

**Desenvolvimento:**
```bash
git pull origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

**Produção (Vercel):**
- Push para branch main
- Deploy automático
- Migrações aplicadas automaticamente

### Migrações de Banco

**Criar nova migração:**
```bash
npx prisma migrate dev --name "descricao_da_mudanca"
```

**Aplicar em produção:**
```bash
npx prisma migrate deploy
```

**Ver status:**
```bash
npx prisma migrate status
```

### Monitoramento

**Métricas Importantes:**

1. **Uso de Licenças:**
   - Crescimento mensal
   - Taxa de ativação
   - Taxa de revogação

2. **Performance:**
   - Tempo de resposta das APIs
   - Tempo de login
   - Tempo de criação de licença

3. **Erros:**
   - Logs de erro do servidor
   - Tentativas de login falhadas
   - Criações de licença falhadas

**Ferramentas:**
- Vercel Analytics (produção)
- Logs do Vercel
- Neon Dashboard (banco)

---

## PERGUNTAS FREQUENTES (ADMIN)

**P: Quantas licenças posso criar?**
R: Ilimitadas. O banco suporta crescimento indefinido.

**P: Posso mudar o tipo de uma licença existente?**
R: Não pela interface. Crie uma nova licença e revogue a antiga.

**P: O que acontece quando uma licença expira?**
R: Status muda para "expired". Usuário tem 3 dias de graça (configurável).

**P: Posso reativar uma licença revogada?**
R: Não pela interface. Crie uma nova licença para o usuário.

**P: Como sei se um usuário ativou a licença?**
R: Verifique "Dispositivos Ativos" > 0 na lista de licenças.

**P: Posso ter múltiplas senhas de admin?**
R: Não atualmente. Apenas uma senha global configurável.

**P: Como faço relatórios mensais?**
R: Use queries SQL fornecidas ou exporte dados via Prisma Studio.

**P: O que fazer se esquecer a senha de admin?**
R: Acesse o servidor e edite ADMIN_PASSWORD no .env.

**P: Posso deletar uma licença permanentemente?**
R: Sim, via SQL ou Prisma Studio. Revogação é preferível (mantém histórico).

**P: Qual a diferença entre Enterprise e Gift?**
R: Enterprise é para empresas (999 usuários). Gift é para doações individuais (1 usuário). Ambas vitalícias.

---

## SUPORTE E ESCALAÇÃO

### Níveis de Suporte

**Nível 1 - Usuário Final:**
- Problemas de ativação: Verifique chave
- Licença expirada: Crie nova ou renove
- Não funciona: Verifique se ativou

**Nível 2 - Administrador (você):**
- Criar/revogar licenças
- Configurar políticas
- Monitorar sistema

**Nível 3 - Desenvolvedor:**
- Bugs do sistema
- Novas funcionalidades
- Problemas de infraestrutura

### Contatos

**Desenvolvedor:**
- Email: lamvial@outlook.com
- Sistema: Representatives PWA v3.0

**Recursos:**
- Documentação: README.md
- Changelog: CHANGELOG.md
- Manual Usuário: MANUAL_USUARIO.md

---

## CONCLUSÃO

Este manual cobre todas as operações administrativas do Representatives PWA v3.0. Como administrador, você tem controle total sobre licenciamento e acesso ao sistema.

### Checklist de Responsabilidades

- [ ] Manter ADMIN_PASSWORD segura
- [ ] Monitorar dashboard regularmente
- [ ] Criar licenças conforme solicitado
- [ ] Revogar acessos não autorizados
- [ ] Fazer backups periódicos
- [ ] Revisar licenças expiradas
- [ ] Responder solicitações de usuários
- [ ] Documentar criações/revogações
- [ ] Atualizar sistema quando disponível
- [ ] Monitorar métricas de uso

### Próximos Passos

1. **Configure o ambiente** (.env)
2. **Faça seu primeiro login** (/admin/login)
3. **Explore o dashboard** (familiarize-se)
4. **Crie uma licença de teste** (trial)
5. **Teste revogação** (em licença de teste)
6. **Configure backups** (Neon)
7. **Documente processos** (sua organização)

O Representatives PWA está pronto para gerenciar seus usuários com segurança e eficiência.

---

**MANUAL DO ADMINISTRADOR - REPRESENTATIVES PWA v3.0**

**Última Atualização:** 05/10/2025  
**Sistema:** Painel Admin Completo + Licenciamento Server-First  
**Status:** Production Ready

Desenvolvido com Next.js + Prisma + PostgreSQL + JWT

**Luiz Antonio Machado Vial**  
lamvial@outlook.com