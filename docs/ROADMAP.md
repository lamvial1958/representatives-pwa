# ROADMAP - REPRESENTATIVES PWA
## Evolução do Sistema: v3.0 (Atual) → v4.0 (Multi-Usuário)

**Última Atualização:** 05/10/2025  
**Versão Atual:** 3.0.0 (Painel Admin Completo)  
**Próxima Versão:** 4.0.0 (Sistema Multi-Usuário)

---

## SITUAÇÃO ATUAL - v3.0.0 ✅ COMPLETO

### Fases Implementadas (100%)

#### ✅ Fase 1 - Sistema Core (Marcos 1-5)
- Persistência durável real (PostgreSQL/Neon)
- 8 APIs de licenciamento funcionais
- PWA instalável com cache offline
- Dashboard inteligente com KPIs reais
- Sistema de licenças 5 tiers

#### ✅ Fase 2 - Licenciamento Server-First (Marcos 6-11)
- Schema completo (License, Device, Backup)
- Políticas configuráveis via .env
- Fingerprint em dois níveis
- Backup e restore completos
- Deploy em produção funcionando

#### ✅ Fase 3 - Painel Admin (Marcos 12-15)
- Autenticação JWT + httpOnly cookies
- Dashboard admin com KPIs e gráficos
- Gerenciamento completo de licenças
- 7 APIs admin (3 auth + 4 gestão)
- Interface profissional responsiva

### Conquistas Técnicas v3.0

- **Build:** 2.7s otimizado
- **Páginas:** 27 funcionais (24 usuário + 3 admin)
- **APIs:** 18 endpoints completos
- **Database:** PostgreSQL com relacionamentos complexos
- **PWA:** 100% compliance, instalável
- **Licenças:** Server-first, 5 tiers, rastreamento seguro

### Limitações Conhecidas v3.0

**❌ Não Suporta:**
- Login de usuários individuais
- Separação de dados por vendedor
- Dashboard gerencial consolidado
- Permissões granulares (vendedor vs gerente)
- Multi-tenancy

**✅ Suporta Apenas:**
- Uso individual (1 pessoa)
- Uso compartilhado (todos veem tudo)
- Licenças com múltiplos "slots" mas sem isolamento

---

## ROADMAP FUTURO - v4.0.0 SISTEMA MULTI-USUÁRIO

### FASE 4 - AUTENTICAÇÃO E MULTI-USUÁRIO (PRIORIDADE MÁXIMA)

**Meta:** Transformar de sistema single-user para multi-user completo com separação de dados e permissões.

---

#### MARCO 16 - Schema de Usuários e Autenticação 🎯

**Objetivo:** Adicionar tabelas de usuários, autenticação e relacionamentos.

**Implementação:**

**1. Novos Modelos Prisma:**
```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  passwordHash  String
  name          String
  role          UserRole      @default(SALESPERSON)
  licenseId     String
  license       License       @relation(...)
  
  // Dados próprios do vendedor
  clients       Client[]
  receivables   Receivable[]
  goals         Goal[]
  
  isActive      Boolean       @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum UserRole {
  SALESPERSON   // Vendedor (vê só seus dados)
  MANAGER       // Gerente (vê dashboard consolidado)
  ADMIN         // Admin (gestão completa)
}

// Atualizar modelos existentes
model Client {
  // ... campos existentes
  userId        String
  user          User          @relation(...)
  // Vendedor dono deste cliente
}

model Receivable {
  // ... campos existentes
  userId        String
  user          User          @relation(...)
  // Vendedor dono desta conta
}

model Goal {
  // ... campos existentes
  userId        String
  user          User          @relation(...)
  // Vendedor dono desta meta
}
```

**2. Migração de Dados:**
- Script para migrar dados existentes
- Criar usuário "admin" padrão
- Associar dados existentes ao admin
- Manter compatibilidade reversa

**3. Sistema de Senhas:**
- bcrypt para hash (12 rounds)
- Validação de força de senha
- Reset de senha via email (futuro)

**Entregáveis:**
- ✅ Schema atualizado e migrado
- ✅ Modelos User + UserRole
- ✅ Relacionamentos Client/Receivable/Goal → User
- ✅ Script de migração de dados

**Tempo Estimado:** 2 dias

---

#### MARCO 17 - APIs de Autenticação de Usuário 🎯

**Objetivo:** Sistema completo de login/logout/registro para usuários finais.

**APIs a Criar:**

**1. POST /api/auth/register** (apenas se licença permite)
```typescript
Body: {
  email: string,
  password: string,
  name: string,
  licenseKey: string  // Valida se licença tem slots disponíveis
}

Response: {
  success: true,
  data: {
    user: { id, email, name, role },
    token: "JWT..."
  }
}

Validações:
- Email único
- Senha forte (min 8 chars, upper, lower, number)
- LicenseKey válida e ativa
- Licença não excedeu maxUsers
- Role inicial: SALESPERSON
```

**2. POST /api/auth/login**
```typescript
Body: {
  email: string,
  password: string
}

Response: {
  success: true,
  data: {
    user: { id, email, name, role, licenseId },
    token: "JWT..."
  }
}

Cookie: user_token (httpOnly, 7 dias)

Validações:
- Email existe
- Password match (bcrypt)
- User isActive = true
- License não expirada/revogada
```

**3. POST /api/auth/logout**
```typescript
Response: { success: true }
Cookie: Removido
```

**4. GET /api/auth/me**
```typescript
Response: {
  success: true,
  data: {
    id, email, name, role, licenseId,
    license: { type, status, expiryDate }
  }
}

Validações:
- Token válido
- User ativo
```

**5. PUT /api/auth/change-password**
```typescript
Body: {
  oldPassword: string,
  newPassword: string
}

Validações:
- Old password correto
- New password forte
```

**Entregáveis:**
- ✅ 5 APIs de autenticação funcionais
- ✅ JWT tokens (7 dias validade)
- ✅ httpOnly cookies seguros
- ✅ Validação de força de senha
- ✅ Verificação de slots disponíveis na licença

**Tempo Estimado:** 3 dias

---

#### MARCO 18 - Middleware e Proteção de Rotas 🎯

**Objetivo:** Proteger todas as APIs com autenticação e autorização.

**Implementação:**

**1. Middleware de Autenticação:**
```typescript
// lib/auth/user-middleware.ts
export async function requireAuth(req: Request) {
  const token = req.cookies.get('user_token')
  if (!token) throw new UnauthorizedError()
  
  const payload = verifyJWT(token)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { license: true }
  })
  
  if (!user || !user.isActive) throw new UnauthorizedError()
  if (user.license.status !== 'active') throw new ForbiddenError()
  
  return user
}
```

**2. Middleware de Autorização:**
```typescript
export async function requireRole(user: User, role: UserRole) {
  const roleHierarchy = {
    ADMIN: 3,
    MANAGER: 2,
    SALESPERSON: 1
  }
  
  if (roleHierarchy[user.role] < roleHierarchy[role]) {
    throw new ForbiddenError()
  }
}
```

**3. Atualizar TODAS as APIs:**
```typescript
// Exemplo: /api/clients/route.ts
export async function GET(req: Request) {
  const user = await requireAuth(req)
  
  // Vendedor vê só seus clientes
  const clients = await prisma.client.findMany({
    where: { userId: user.id }
  })
  
  return { success: true, data: clients }
}

// Exemplo: /api/dashboard/route.ts
export async function GET(req: Request) {
  const user = await requireAuth(req)
  
  if (user.role === 'SALESPERSON') {
    // Dashboard pessoal
    const stats = await getPersonalStats(user.id)
  } else if (user.role === 'MANAGER') {
    // Dashboard consolidado do time
    const stats = await getTeamStats(user.licenseId)
  }
  
  return { success: true, data: stats }
}
```

**4. Row Level Security (RLS):**
- Garantir que queries sempre filtram por userId
- Prevenir acesso cruzado entre vendedores
- Manager pode ver tudo da mesma licença

**Entregáveis:**
- ✅ Middleware de autenticação
- ✅ Middleware de autorização por role
- ✅ Todas as 18 APIs protegidas
- ✅ Row-level security implementado
- ✅ Testes de segurança

**Tempo Estimado:** 4 dias

---

#### MARCO 19 - Interface de Login e Registro 🎯

**Objetivo:** Páginas web para login, registro e gestão de perfil.

**Páginas a Criar:**

**1. /auth/login (Nova)**
```typescript
// app/auth/login/page.tsx
- Formulário: email + password
- Botão "Login"
- Link "Criar conta"
- Redirecionamento: dashboard após login
- Mensagens de erro amigáveis
```

**2. /auth/register (Nova)**
```typescript
// app/auth/register/page.tsx
- Formulário: name, email, password, confirm password, licenseKey
- Validação em tempo real (senha forte)
- Verificação de slots disponíveis
- Redirecionamento: dashboard após registro
- Opção "Já tem conta? Login"
```

**3. /auth/profile (Nova)**
```typescript
// app/auth/profile/page.tsx
- Exibir dados do usuário
- Alterar nome
- Alterar senha
- Ver licença associada
- Logout
```

**4. Atualizar Layout Raiz:**
```typescript
// app/layout.tsx
- Verificar autenticação
- Redirecionar para /auth/login se não autenticado
- Exibir nome do usuário no header
- Botão "Perfil" e "Sair"
```

**5. Context Provider:**
```typescript
// components/AuthProvider.tsx
- Gerenciar estado do usuário logado
- Refresh token automático
- Logout em caso de token expirado
- Loading states
```

**Entregáveis:**
- ✅ Página de login funcional
- ✅ Página de registro funcional
- ✅ Página de perfil
- ✅ AuthProvider com context
- ✅ Redirecionamentos automáticos
- ✅ UI/UX profissional

**Tempo Estimado:** 3 dias

---

#### MARCO 20 - Dashboard Gerencial e Permissões 🎯

**Objetivo:** Dashboards diferenciados por role e gestão de usuários.

**Implementação:**

**1. Dashboard Pessoal (SALESPERSON):**
```typescript
// app/dashboard/page.tsx (existente, adaptar)
- KPIs pessoais do vendedor
- Seus clientes
- Suas contas a receber
- Suas metas
- Sem ver dados de outros
```

**2. Dashboard Gerencial (MANAGER):**
```typescript
// app/manager/dashboard/page.tsx (nova)
- KPIs consolidados da licença
- Total de vendedores ativos
- Top vendedores (ranking)
- Comparativo de performance
- Gráficos de evolução do time
- Lista de todos os clientes (todos vendedores)
- Contas a receber consolidadas
```

**3. Gestão de Usuários (MANAGER + ADMIN):**
```typescript
// app/manager/users/page.tsx (nova)
- Lista de usuários da licença
- Ativar/desativar usuários
- Alterar role (MANAGER apenas)
- Ver estatísticas por usuário
- Resetar senha (futuro)
```

**4. APIs Admin Atualizadas:**
```typescript
// /api/admin/users/route.ts (nova)
GET:  Listar usuários (filtro por licença)
POST: Criar usuário admin
PUT:  Atualizar role, ativar/desativar

// /api/manager/stats/route.ts (nova)
GET: Estatísticas consolidadas da licença
```

**5. Navegação Condicional:**
```typescript
// components/Sidebar.tsx
if (user.role === 'SALESPERSON') {
  // Menu: Dashboard, Clientes, Contas, Metas, Perfil
}
if (user.role === 'MANAGER') {
  // Menu: Dashboard, Dashboard Time, Clientes Time, Usuários, Perfil
}
if (user.role === 'ADMIN') {
  // Menu completo + Admin Licenças
}
```

**Entregáveis:**
- ✅ Dashboard pessoal adaptado
- ✅ Dashboard gerencial novo
- ✅ Página de gestão de usuários
- ✅ APIs de stats consolidadas
- ✅ Navegação condicional por role
- ✅ Permissões testadas

**Tempo Estimado:** 5 dias

---

#### MARCO 21 - Admin: Gestão de Usuários por Licença 🎯

**Objetivo:** Admin pode ver e gerenciar usuários de cada licença.

**Implementação:**

**1. Atualizar Painel Admin de Licenças:**
```typescript
// app/admin/licenses/page.tsx
- Adicionar coluna "Usuários Ativos"
- Botão "Ver Usuários" por licença
- Modal listando usuários da licença
```

**2. Nova Página Admin de Usuários:**
```typescript
// app/admin/users/page.tsx (nova)
- Lista global de todos os usuários
- Filtros: por licença, por role, ativo/inativo
- Busca por email ou nome
- Ações: ativar/desativar, alterar role
- Ver estatísticas de uso
```

**3. APIs Admin de Usuários:**
```typescript
// /api/admin/users/route.ts
GET:    Listar todos os usuários (com filtros)
POST:   Criar usuário vinculado a licença
PUT:    Atualizar usuário (role, ativo, etc)
DELETE: Desativar usuário (soft delete)

// /api/admin/licenses/[id]/users/route.ts
GET: Listar usuários de uma licença específica
```

**4. Regras de Negócio:**
```typescript
- maxUsers da licença é respeitado
- Não pode criar mais usuários que o limite
- Ao revogar licença, desativa todos os usuários
- Manager de uma licença não vê usuários de outras
- Admin vê tudo
```

**Entregáveis:**
- ✅ Interface admin para usuários
- ✅ APIs de gestão de usuários
- ✅ Validação de maxUsers
- ✅ Integração com licenças
- ✅ Soft delete (desativação)

**Tempo Estimado:** 3 dias

---

### RESUMO DA FASE 4

**Total de Marcos:** 6 (Marcos 16-21)  
**Tempo Total Estimado:** 20 dias úteis (~1 mês)

**Entregas Principais:**
- Sistema completo de autenticação de usuários
- Login/registro/perfil funcionais
- Separação de dados por vendedor
- Dashboard gerencial consolidado
- Permissões por role (Vendedor/Gerente/Admin)
- Gestão de usuários por licença
- Multi-tenancy básico

**Benefícios:**
- ✅ Suporta times de vendas reais
- ✅ Cada vendedor vê só seus clientes
- ✅ Gerente vê dashboard consolidado
- ✅ Admin gerencia tudo
- ✅ Escala para 50+ usuários por licença
- ✅ Casos de uso da página de vendas se tornam REAIS

---

## FASES FUTURAS (v5.0+)

### FASE 5 - Relatórios Avançados (v5.0)

**Marcos 22-25:**
- Exportação de dados (CSV, Excel, PDF)
- Relatórios personalizáveis
- Filtros avançados de data
- Gráficos de evolução temporal

**Tempo Estimado:** 2 semanas

### FASE 6 - Integrações (v6.0)

**Marcos 26-28:**
- API pública para integrações
- Webhooks para eventos importantes
- Integração com sistemas de nota fiscal
- Sincronização com planilhas

**Tempo Estimado:** 3 semanas

### FASE 7 - Mobile Nativo (v7.0)

**Marcos 29-32:**
- App React Native (iOS + Android)
- Sincronização offline melhorada
- Push notifications
- Geolocalização de visitas

**Tempo Estimado:** 2 meses

---

## PRIORIZAÇÃO

### Prioridade MÁXIMA (Começar Agora)
**Fase 4 - Sistema Multi-Usuário**
- Desbloqueio de casos de uso empresariais
- Multiplica valor comercial do produto
- Requisito para crescimento

### Prioridade Alta (Após Fase 4)
**Fase 5 - Relatórios**
- Requisito comum de clientes
- Diferencial competitivo
- ROI alto

### Prioridade Média
**Fase 6 - Integrações**
- Expande ecossistema
- Atrai clientes enterprise

### Prioridade Baixa
**Fase 7 - Mobile Nativo**
- PWA já funciona em mobile
- Alto custo de desenvolvimento
- Manutenção duplicada

---

## MÉTRICAS DE SUCESSO

### Fase 4 Completa Quando:
- ✅ 100% das APIs protegidas com auth
- ✅ Login/registro funcionando sem bugs
- ✅ Vendedor vê só seus dados
- ✅ Gerente vê dashboard consolidado
- ✅ Admin gerencia usuários
- ✅ Licenças respeitam maxUsers
- ✅ Zero vazamento de dados entre usuários
- ✅ Performance mantida (< 300ms APIs)
- ✅ Testes de segurança passando

### KPIs de Adoção:
- Número de licenças ativas com múltiplos usuários
- Satisfação de clientes enterprise
- Tempo médio de onboarding de novo usuário
- Taxa de conversão trial → pago

---

## CRONOGRAMA SUGERIDO

### Semana 1-2 (Marcos 16-17)
- Schema de usuários
- APIs de autenticação
- **Entrega:** Sistema de login funcional

### Semana 3-4 (Marcos 18-19)
- Proteção de rotas
- Interfaces de login/registro
- **Entrega:** Usuários podem se registrar e acessar

### Semana 5 (Marco 20)
- Dashboards diferenciados
- Permissões por role
- **Entrega:** Gerente vê consolidado

### Semana 6 (Marco 21)
- Admin gerencia usuários
- Testes completos
- **Entrega:** v4.0.0 em produção

---

## RISCOS E MITIGAÇÕES

### Risco 1: Migração de Dados Existentes
**Impacto:** Alto  
**Probabilidade:** Média  
**Mitigação:**
- Script de migração bem testado
- Backup completo antes de aplicar
- Rollback plan preparado
- Teste em ambiente dev primeiro

### Risco 2: Performance com Múltiplos Usuários
**Impacto:** Médio  
**Probabilidade:** Baixa  
**Mitigação:**
- Índices corretos no banco
- Queries otimizadas desde o início
- Testes de carga antes de produção
- Monitoring de performance

### Risco 3: Complexidade de Permissões
**Impacto:** Alto  
**Probabilidade:** Média  
**Mitigação:**
- Roles simples (3 apenas)
- Middleware centralizado
- Testes de segurança extensivos
- Code review rigoroso

### Risco 4: UX de Login Adiciona Fricção
**Impacto:** Médio  
**Probabilidade:** Alta  
**Mitigação:**
- Login "Remember me" (7 dias)
- UX super simples
- Onboarding guiado
- Trial sem login (opcional)

---

## DECISÕES TÉCNICAS

### Autenticação: JWT vs Sessions
**Decisão:** JWT em httpOnly cookies  
**Motivo:** 
- Stateless (escala melhor)
- Já usado no admin
- Seguro (httpOnly)
- Expiração configurável

### Banco: Adicionar Tabelas vs Novo Schema
**Decisão:** Adicionar tabelas ao schema existente  
**Motivo:**
- Relacionamentos diretos
- Queries mais simples
- Transações atômicas
- Menos complexidade

### Roles: 3 vs 5+ Roles
**Decisão:** 3 roles (Vendedor/Gerente/Admin)  
**Motivo:**
- Simplicidade
- Cobre 95% dos casos
- Fácil de entender
- Pode expandir depois

### Multi-Tenancy: Soft vs Hard
**Decisão:** Soft (mesma DB, filtro por licenseId)  
**Motivo:**
- Mais simples de implementar
- Custo operacional menor
- Suficiente para escala atual
- Migração para hard no futuro se necessário

---

## CONCLUSÃO

A **Fase 4 - Sistema Multi-Usuário** é a evolução natural e NECESSÁRIA do Representatives PWA. Sem ela, o sistema fica limitado a uso individual ou compartilhado básico.

**Com Fase 4 implementada:**
- ✅ Times de vendas podem usar de verdade
- ✅ Cada vendedor gerencia seus clientes
- ✅ Gerentes têm visão consolidada
- ✅ Casos de uso da página de vendas são REAIS
- ✅ Valor comercial multiplica
- ✅ Escalabilidade garantida

**Próximo Passo Imediato:**
Começar Marco 16 - Schema de Usuários

---

**ROADMAP - REPRESENTATIVES PWA**  
**Versão Atual:** 3.0.0 (Admin Completo)  
**Próxima Major:** 4.0.0 (Multi-Usuário - PRIORIDADE)  
**Visão Long-Term:** 7.0.0 (Plataforma Completa)

**Desenvolvido com planejamento estratégico**  
**Luiz Antonio Machado Vial** | lamvial@outlook.com