# MANUAL DO USUÁRIO - REPRESENTATIVES PWA

**Versão:** 3.0.0  
**Data:** 05/10/2025  
**Sistema:** PWA Completo para Representantes Comerciais  
**Público:** Usuário Final

---

## VISÃO GERAL DO SISTEMA

O Representatives PWA é um sistema completo desenvolvido com **persistência durável real**. Funciona como aplicativo instalável com dados que nunca se perdem, sistema de licenciamento profissional server-first e funcionalidades avançadas de CRM.

### PRINCIPAIS FUNCIONALIDADES

✅ **Persistência Durável Real** - PostgreSQL no servidor  
✅ **Gestão de Clientes** - CRUD completo com CRM  
✅ **Contas a Receber** - Controle financeiro completo  
✅ **Objetivos** - Metas com progresso automático  
✅ **Sistema de Licenças** - 5 tiers profissionais  
✅ **Dashboard Inteligente** - KPIs em tempo real  
✅ **PWA Instalável** - Funciona offline  
✅ **Cache Inteligente** - Background sync automático

---

## INSTALAÇÃO E PRIMEIRO ACESSO

### INSTALAÇÃO SIMPLIFICADA

**1. Acesse o sistema:**
- **Produção:** https://representatives-pwa-933i.vercel.app/
- **Desenvolvimento:** http://localhost:3000

**2. Sistema inicializa automaticamente:**
- Banco de dados PostgreSQL pronto
- Interface carregada
- Pronto para ativar licença

**3. Instalar como PWA:**
- **Desktop:** Clique no ícone "Instalar" na barra de endereços
- **Android:** Menu → "Adicionar à tela inicial"
- **iOS:** Compartilhar → "Adicionar à Tela de Início"

### O QUE ESTÁ INCLUÍDO

- Sistema Representatives PWA completo
- 18 APIs RESTful funcionais
- Sistema de licenciamento server-first
- Cache offline inteligente
- Dashboard com dados em tempo real
- Rastreamento seguro de dispositivos

### REQUISITOS

- **Navegador:** Chrome, Firefox, Edge ou Safari (atualizado)
- **Conexão:** Internet para operação (funciona offline após cache)
- **Espaço:** Mínimo para cache local
- **Sistema:** Qualquer SO moderno
- **Licença:** Chave válida fornecida pelo administrador

---

## SISTEMA DE LICENCIAMENTO

### COMO FUNCIONA

O sistema possui controle real de licenças com validação server-side. Sua licença é vinculada ao hardware do seu computador e permite acesso às funcionalidades do sistema.

### TIPOS DE LICENÇA

#### 1. Trial (Teste Grátis)
- **Duração:** 90 dias
- **Usuários:** 1
- **Features:** Basic, Clients, Receivables
- **Prefixo:** `TRIL-2025-XXXX-YYYY`

#### 2. Standard (Padrão)
- **Duração:** 1 ano
- **Usuários:** Até 5
- **Features:** Basic, Clients, Receivables, Goals, Reports
- **Prefixo:** `STND-2025-XXXX-YYYY`

#### 3. Premium
- **Duração:** 1 ano
- **Usuários:** Até 10
- **Features:** Standard + Analytics + Export avançado
- **Prefixo:** `PREM-2025-XXXX-YYYY`

#### 4. Enterprise (Empresa)
- **Duração:** Vitalícia (sem expiração)
- **Usuários:** 999 (ilimitado)
- **Features:** Todas as funcionalidades
- **Prefixo:** `ENTP-2025-XXXX-YYYY`

#### 5. Gift (Doação)
- **Duração:** Vitalícia (sem expiração)
- **Usuários:** 1
- **Features:** Todas as funcionalidades
- **Prefixo:** `GIFT-2025-XXXX-YYYY`

### ATIVAR SUA LICENÇA

**Passo a passo:**

1. **Receba sua chave**
   - Fornecida pelo administrador do sistema
   - Formato: `XXXX-2025-XXXX-YYYY`
   - Exemplo: `GIFT-2025-A1B2-3456`

2. **Acesse a página de licenças**
   - URL: `/license`
   - Menu: "Licenças" no cabeçalho

3. **Preencha o formulário**
   ```
   Chave da Licença: [GIFT-2025-A1B2-3456]
   Nome do Titular:  [Seu Nome] (opcional)
   
   [Ativar Licença]
   ```

4. **Aguarde a validação**
   - Sistema verifica a chave no servidor
   - Gera ID único do seu dispositivo
   - Vincula licença ao hardware

5. **Licença ativada!**
   - Confirmação visual aparece
   - Features liberadas automaticamente
   - Sistema pronto para uso

### ENTENDENDO O DEVICE ID

**O que é:**
- Identificador único gerado do seu hardware
- Baseado em: Canvas, CPU, RAM, Resolução, Timezone
- Exibido truncado: Primeiros 12 caracteres

**Por que é necessário:**
- Segurança: Impede uso não autorizado
- Rastreamento: Uma licença por computador
- Proteção: Seu hardware = sua licença

**Importante:**
- Atualizações de navegador NÃO invalidam a licença
- Atualizações de Windows NÃO invalidam a licença
- Mudança de hardware PODE invalidar (entre em contato)

### INTERFACE DE LICENÇAS

**Painel de Status:**

```
┌─────────────────────────────────────────────────┐
│  STATUS DA LICENÇA                              │
│                                                 │
│  Tipo: Gift                 Status: Ativa      │
│  Chave: GIFT-****-****      Device: 4a7f...    │
│  Emitida Para: João Silva   Vitalícia          │
│  Criada: 05/10/2025         Expira: Nunca      │
│                                                 │
│  Features Habilitadas:                          │
│  ✓ Basic  ✓ Clients  ✓ Receivables            │
│  ✓ Goals  ✓ Reports  ✓ Analytics              │
│                                                 │
│  Políticas de Segurança:                        │
│  • Tolerância: 90% para mudanças de browser    │
│  • Grace Period: 3 dias para ajustes           │
│                                                 │
│  [Criar Backup]  [Restaurar]                    │
└─────────────────────────────────────────────────┘
```

### BACKUP E RESTORE

**Criar Backup:**
1. Clique em "Criar Backup"
2. Sistema salva snapshot completo
3. Backup armazenado no servidor
4. Confirmação visual aparece

**Restaurar:**
1. Clique em "Restaurar"
2. Selecione backup da lista
3. Confirme a restauração
4. Sistema retorna ao estado salvo

**Quando usar:**
- Antes de mudanças importantes
- Backup preventivo periódico
- Recuperação de problemas

---

## NAVEGAÇÃO DO SISTEMA

### INTERFACE PRINCIPAL

```
Header: [Logo] [Dashboard] [Clientes] [Recebíveis] [Objetivos] [Licenças]
```

### PÁGINAS DISPONÍVEIS

- **Dashboard** (`/`) - KPIs e métricas em tempo real
- **Clientes** (`/clients`) - CRM completo com busca
- **Contas a Receber** (`/receivables`) - Gestão financeira
- **Objetivos** (`/goals`) - Metas com progresso automático
- **Licenças** (`/license`) - Gerenciamento de licença

### AÇÕES RÁPIDAS

- **+ Cliente:** Cabeçalho superior direito
- **$ Nova Conta:** Página de recebíveis
- **🎯 Novo Objetivo:** Página de metas
- **🔍 Busca:** Disponível em todas as listas

---

## 1. PAINEL - DADOS REAIS

**Localização:** `/`

### MÉTRICAS EM TEMPO REAL

**Total de Clientes:**
- Contador com clientes ativos/inativos
- Atualização automática
- Link direto para gestão

**Contas a Receber:**
- Valor total por status (pago/pendente/vencido)
- Distribuição visual com cores
- Alertas de vencimento

**Receita Total:**
- Calculada automaticamente
- Soma de contas recebidas
- Atualização em tempo real

**Objetivos Ativos:**
- Quantidade de metas ativas
- Progresso médio percentual
- Status visual colorido

### WIDGETS INTELIGENTES

**Top 5 Clientes:**
- Ranking por valor total de contas
- Dados atualizados em tempo real
- Link direto para perfil

**Objetivos em Andamento:**
- Progresso visual com barras
- Percentual calculado automaticamente
- Dias restantes para conclusão
- Status: Ativo/Atrasado/Concluído

**Estatísticas Mensais:**
- Gráfico de evolução (últimos 6 meses)
- Média mensal de vendas
- Tendências visualizadas

**Distribuição por Status:**
- Contas pendentes: Valor + quantidade
- Contas vencidas: Alertas em vermelho
- Contas pagas: Histórico verde
- Renegociadas: Status especial

### RECURSOS ÚNICOS

- Queries otimizadas para performance
- Cache inteligente de dados
- Responsivo: Funciona em qualquer dispositivo
- PWA ready: Instalável como app

---

## 2. CLIENTES - CRM COMPLETO

**Localização:** `/clients`

### LISTA INTELIGENTE

**Visualização:**
- Cards elegantes com informações essenciais
- Nome, empresa, email, telefone
- Total de contas e status

**Busca Avançada:**
- Por nome, email ou empresa
- Busca inteligente (OR query)
- Resultados instantâneos

**Filtros:**
- Ativos/Inativos
- Por estado ou região
- Por segmento

**Ordenação:**
- Alfabética (A-Z)
- Data de criação
- Último contato

**Paginação:**
- 50 clientes por página
- Navegação fácil
- Total sempre visível

### NOVO CLIENTE

**Como criar:**

1. **Acesso:**
   - Clique "+ Cliente" no cabeçalho
   - Ou botão na página de clientes

2. **Formulário:**
   ```
   Nome Completo:    [Obrigatório]
   Empresa:          [Opcional]
   Email:            [Único - validado]
   Telefone:         [Com formatação]
   Cidade:           [Opcional]
   Estado:           [Opcional]
   Observações:      [Campo livre]
   ```

3. **Validações automáticas:**
   - Nome é obrigatório
   - Email único (não permite duplicados)
   - Telefone formatado automaticamente
   - Feedback visual em tempo real

4. **Salvamento:**
   - Dados persistem no servidor
   - Confirmação visual
   - Redirecionamento para perfil

### PERFIL DO CLIENTE

**Informações completas:**
- Dados cadastrais
- Histórico de interações
- Contas a receber relacionadas

**Estatísticas:**
- Total em aberto
- Contas vencidas
- Contas pagas
- Ticket médio

**Timeline:**
- Histórico de atividades
- Últimas interações
- Mudanças de status

**Ações disponíveis:**
- ✏️ Editar cadastro
- 💰 Nova conta
- 📊 Relatórios
- 🗑️ Excluir (com proteção)

### EDIÇÃO E EXCLUSÃO

**Editar:**
- Formulário pré-preenchido
- Mesmas validações da criação
- Histórico preservado

**Excluir:**
- Proteção: Não permite se há contas ativas
- Confirmação obrigatória
- Logs de auditoria mantidos

---

## 3. CONTAS A RECEBER - GESTÃO FINANCEIRA

**Localização:** `/receivables`

### PAINEL FINANCEIRO

**Total a Receber:**
- Soma de contas pendentes
- Atualização em tempo real
- Breakdown por status

**Distribuição por Status:**
- 🟢 **Recebido:** Pagas em dia
- 🟡 **Pendente:** Aguardando pagamento
- 🔴 **Vencido:** Atrasadas
- 🔵 **Renegociado:** Em nova negociação

**Vencimentos:**
- Hoje: Alertas prioritários
- Esta semana: Planejamento
- Este mês: Visão geral

**KPIs:**
- Taxa de inadimplência
- Ticket médio
- Tempo médio de recebimento

### LISTA INTELIGENTE

**Cards com status visual:**
- Cores por status
- Cliente e valor destacados
- Data de vencimento
- Ações rápidas

**Filtros Avançados:**
- Por status (pendente/vencido/pago)
- Por cliente (dropdown com busca)
- Por período (data início/fim)
- Por valor (mínimo/máximo)

**Ordenação:**
- Vencimento (próximo primeiro)
- Valor (maior/menor)
- Cliente (alfabético)
- Status

### NOVA CONTA

**Como criar:**

1. **Acesso:**
   - Botão "Nova Conta"
   - Ou "+ Conta" no cabeçalho

2. **Formulário:**
   ```
   Cliente:          [Selecione da lista]
   Valor:            [R$ obrigatório, positivo]
   Data Vencimento:  [Data válida]
   Descrição:        [Opcional]
   Status:           [Pendente - automático]
   ```

3. **Validações:**
   - Cliente obrigatório (da lista)
   - Valor positivo (não aceita zero/negativo)
   - Data válida
   - Cliente deve existir

4. **Salvamento:**
   - Relacionamento criado automaticamente
   - Status inicial: Pendente
   - Confirmação visual

### AÇÕES SOBRE CONTAS

**Marcar como Pago:**
1. Clique no ícone de check
2. Status: Pendente → Recebido
3. Data de recebimento: Automática
4. Histórico registrado

**Renegociar:**
1. Clique em "Renegociar"
2. Nova data de vencimento
3. Valor pode ser alterado
4. Status: Renegociado
5. Observações: Motivo registrado

**Editar:**
- Todos os campos editáveis
- Validações mantidas
- Histórico preservado

**Excluir:**
- Confirmação obrigatória
- Audit trail mantido
- Reversível via backup

---

## 4. OBJETIVOS - METAS INTELIGENTES

**Localização:** `/goals`

### PAINEL DE METAS

**Cards de progresso:**
- Barras visuais animadas
- Percentual em tempo real
- Status colorido

**Status disponíveis:**
- 🟢 **Ativo:** Em andamento
- ✅ **Concluído:** 100% ou mais
- 🔴 **Atrasado:** Prazo vencido
- ⏸️ **Pausado:** Temporariamente

### NOVO OBJETIVO

**Tipos de período:**
- Diário (1 dia)
- Semanal (7 dias)
- Mensal (mês comercial)
- Trimestral (90 dias)
- Anual (365 dias)
- Personalizado (qualquer intervalo)

**Como criar:**

1. **Acesso:**
   - Botão "Novo Objetivo"
   - Página de metas

2. **Formulário:**
   ```
   Título:           [Descrição da meta]
   Tipo de Período:  [Selecione]
   Data Início:      [Automática ou manual]
   Data Fim:         [Calculada ou manual]
   Meta Financeira:  [R$ obrigatório]
   Meta de Vendas:   [Quantidade - opcional]
   Descrição:        [Detalhes e contexto]
   ```

3. **Validações:**
   - Título obrigatório
   - Datas válidas (fim > início)
   - Meta financeira positiva
   - Meta de vendas opcional

4. **Salvamento:**
   - Status inicial: Ativo
   - Progresso: 0%
   - Confirmação visual

### ACOMPANHAMENTO AUTOMÁTICO

**Cálculo de progresso:**
- **Percentual financeiro:** (atual / meta) × 100
- **Percentual vendas:** (atual / meta) × 100
- **Dias restantes:** (fim - hoje)
- **Status:** Baseado em % e prazo

**Atualização:**
- Manual: Editar valores atuais
- Automática: Via integração vendas (futuro)
- Histórico: Todas alterações registradas

### GESTÃO DE OBJETIVOS

**Editar:**
- Todos os campos editáveis
- Recalculo automático
- Validações mantidas

**Alterar Status:**
- ⏸️ Pausar: Temporariamente
- ❌ Cancelar: Definitivamente
- ▶️ Reativar: Voltar ao ativo
- ✅ Concluir: Marcar finalizado

**Usos Práticos:**
- Metas mensais de receita
- Campanhas sazonais
- Grandes contratos
- Metas trimestrais
- Eventos e feiras

---

## 5. FUNCIONALIDADES TÉCNICAS

### PWA PROFISSIONAL

**Service Worker Ativo:**
- Cache inteligente por tipo de recurso
- Funciona offline após primeiro acesso
- Sincronização automática quando online

**Estratégias de Cache:**
```
Fontes:     Cache permanente (1 ano)
Imagens:    Cache com revalidação (24h)
JS/CSS:     Cache com revalidação (24h)
APIs:       Network-first + fallback (24h)
Páginas:    Network-first + timeout (10s)
```

**Instalação:**
- Desktop: Ícone na barra de endereços
- Android: Adicionar à tela inicial
- iOS: Compartilhar → Adicionar

### SEGURANÇA

**Proteção de Dados:**
- HTTPS obrigatório em produção
- Dados criptografados em trânsito
- Validação server-side completa

**Licenciamento:**
- Rastreamento de dispositivo
- Fingerprint em dois níveis
- Impossível burlar no cliente

**Privacidade:**
- Dados apenas no servidor
- Zero localStorage crítico
- Backup controlado

---

## SOLUÇÃO DE PROBLEMAS

### PROBLEMAS DE ACESSO

**Não consigo ativar licença:**
1. Verifique a chave (formato correto)
2. Confirme conexão com internet
3. Tente novamente em alguns minutos
4. Entre em contato com administrador

**Licença não aparece após ativar:**
1. Recarregue a página (F5)
2. Limpe cache do navegador
3. Verifique em `/license`
4. Entre em contato se persistir

**Mensagem "Device não encontrado":**
1. Normal na primeira ativação
2. Sistema cria automaticamente
3. Aguarde alguns segundos
4. Recarregue a página

### PROBLEMAS DE DADOS

**Dashboard vazio:**
- Normal se é primeira vez
- Crie clientes e contas
- Dados aparecem automaticamente

**Não consigo criar cliente:**
1. Verifique email único
2. Preencha campos obrigatórios
3. Verifique conexão
4. Tente novamente

**Conta não aparece:**
1. Recarregue a página
2. Verifique filtros ativos
3. Busque pelo cliente
4. Entre em contato se persistir

### PWA NÃO INSTALA

**Checklist:**
- ✅ HTTPS ativo (produção)
- ✅ Service Worker registrado
- ✅ Manifest válido
- ✅ Ícones disponíveis

**Como verificar:**
1. Abra DevTools (F12)
2. Aba "Application"
3. Seção "Service Workers"
4. Verifique status "Activated"

---

## MANUTENÇÃO E BACKUP

### BACKUP DE LICENÇA

**Criar backup:**
1. Acesse `/license`
2. Clique "Criar Backup"
3. Aguarde confirmação
4. Backup salvo no servidor

**Restaurar:**
1. Acesse lista de backups
2. Selecione o desejado
3. Confirme restauração
4. Sistema volta ao estado salvo

**Quando usar:**
- Antes de mudanças importantes
- Backup preventivo mensal
- Recuperação de problemas

### ATUALIZAÇÕES

**Sistema atualiza automaticamente:**
- PWA verifica novas versões
- Download em background
- Instalação na próxima visita
- Notificação visual aparece

**Forçar atualização:**
1. Feche todas as abas
2. Reabra o sistema
3. Ou: Ctrl+Shift+R (hard refresh)

---

## PERGUNTAS FREQUENTES

**Q: Posso usar em múltiplos computadores?**
R: Depende da sua licença. Enterprise permite múltiplos usuários. Outras licenças são vinculadas a um dispositivo específico.

**Q: O que acontece se meu navegador atualizar?**
R: Nada. Atualizações de navegador não afetam sua licença.

**Q: E se formatar o computador?**
R: Entre em contato com o administrador para reativar a licença no computador formatado.

**Q: Funciona offline?**
R: Sim, após o primeiro acesso com internet. Sincroniza automaticamente quando voltar online.

**Q: Posso exportar meus dados?**
R: Funcionalidade em desenvolvimento. Entre em contato com o administrador.

**Q: Como renovo minha licença?**
R: Entre em contato com o administrador antes da expiração.

---

## CONCLUSÃO

### SISTEMA COMPLETO

Representatives PWA v3.0.0 oferece:

✅ **Persistência Durável Real**
- PostgreSQL no servidor
- Dados nunca se perdem
- Backup automático

✅ **PWA Profissional**
- Instalável em qualquer dispositivo
- Funciona offline
- Performance otimizada

✅ **Sistema de Licenças Server-First**
- 5 tiers comerciais
- Rastreamento seguro
- Validação em tempo real

✅ **Painel Inteligente**
- KPIs em tempo real
- Dados sempre atualizados
- Interface responsiva

### PRONTO PARA USO

O Representatives PWA está 100% funcional e pronto para maximizar seus resultados comerciais.

Explore todas as funcionalidades e aproveite ao máximo!

---

**MANUAL DO USUÁRIO - REPRESENTATIVES PWA v3.0.0**

**Última Atualização:** 05/10/2025  
**Sistema:** Production-Ready com Persistência Durável Real  
**Status:** Sistema Completo + Licenciamento Server-First

Desenvolvido com dedicação usando Next.js + Prisma + PostgreSQL + PWA

**Luiz Antonio Machado Vial**  
lamvial@outlook.com

---

**Suporte:**
- Para problemas com licença: Entre em contato com o administrador
- Para dúvidas de uso: Consulte este manual
- Para bugs ou sugestões: lamvial@outlook.com