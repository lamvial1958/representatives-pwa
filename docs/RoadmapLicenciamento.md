Contexto e ordem de execução
Data/hora atual: sábado, 04 de outubro de 2025 UTC.
Redesenho aprovado: licenciamento “server-first”, sem localStorage. Fonte de verdade = banco remoto.
Sequência acordada:
Banco e rotas de API
Inverter o fluxo no LicenseManager (cliente chama servidor)
Ajustar ferramentas de recuperação (backups/diagnóstico no servidor)
Observação importante: em produção no Vercel, use banco remoto (Postgres/MySQL/LibSQL). Evite SQLite em arquivo, pois não persiste entre deploys.
Fase 1 — Banco (modelos) e migrações
Definir/confirmar provider do Prisma e DATABASE_URL para um banco remoto (Production e Preview no Vercel).
Criar os modelos (conceitos; implementar no Prisma):
License
id, licenseKey (única), type (‘trial’ | ‘standard’ | ‘premium’ | ‘enterprise’), status (‘active’ | ‘expired’ | ‘revoked’ | ‘suspended’)
issuedTo (empresa/cliente), companyName (se usar), features (string[]/JSON), maxUsers? (int)
expiresAt? (datetime), createdAt, updatedAt
LicenseDevice
id, licenseId (FK → License)
deviceId (único; fingerprint do navegador)
deviceInfo (JSON), fingerprintHistory (JSON)
firstSeenAt, lastSeenAt, lastValidatedAt
status (‘active’ | ‘blocked’), se desejar
LicenseBackup (opcional)
id, licenseId (e/ou deviceId), snapshot (JSON), reason (string), createdAt
Índices/constraints:
License.licenseKey único.
LicenseDevice.deviceId único.
(Opcional) índice composto licenseId+deviceId.
Campos derivados não persistem:
isLifetime (derivado de expiresAt nula)
daysRemaining (derivado de hoje vs expiresAt)
Rodar migração local, revisar, e comitar a pasta prisma/migrations.
Pipeline de produção: garantir migrate deploy antes de next build (ex.: “prisma generate && prisma migrate deploy && next build”).
Fase 2 — API oficial de Licenças (endpoints e o que cada um persiste)
Retorno padrão (LicenseView) usado pela UI:
hasLicense: boolean
key: string
type: ‘trial’ | ‘standard’ | ‘premium’ | ‘enterprise’
status: ‘active’ | ‘expired’ | ‘revoked’ | ‘suspended’
deviceId: string
issuedTo: string
expiryDate: string | null (ISO)
isLifetime: boolean (derivado)
daysRemaining: number (derivado)
maxUsers?: number
features: string[]
policy: { fingerprintTolerance: number; graceDays: number; allowTrial: boolean; trialDays: number }
Endpoints (sem escrever código, apenas o contrato/efeitos):
POST /api/license/activate
Entrada: { licenseKey, deviceId, deviceInfo }
Validações:
licenseKey existe e não está revogada/suspensa.
Se allowTrial e não existir licenseKey, pode criar licença trial (política).
Efeitos/persistência:
Cria/atualiza License (se trial/criação) e associa LicenseDevice (se não existir).
Preenche deviceInfo, fingerprintHistory inicial (fingerprint atual).
firstSeenAt/lastSeenAt/lastValidatedAt = agora.
Ajusta status da License se necessário (ex.: ‘active’).
Retorno: { success, data: LicenseView }
GET /api/license?deviceId=...
Entrada: query deviceId
Ações:
Busca LicenseDevice e sua License.
(Opcional) Atualiza lastSeenAt = agora.
Retorno: { success, data: LicenseView } ou 404/hasLicense=false se não achar.
PUT /api/license/heartbeat
Entrada: { deviceId, fingerprint, similarity, usageTick?: { type: 'open' | 'ping', ... } }
Efeitos/persistência:
Atualiza lastSeenAt/lastValidatedAt.
Se fingerprint mudou de forma relevante, anexa ao fingerprintHistory com similarity e timestamp.
(Opcional) Atualiza usagePattern (contadores por dia).
Reavalia status da License (expired, grace, active).
Retorno: { success, data: LicenseView }
DELETE /api/license/device
Entrada: { deviceId }
Efeitos/persistência:
Desassocia ou marca LicenseDevice como ‘blocked’/‘removed’.
Retorno: { success: true }
GET /api/license/policy
Sem entrada.
Retorno: { success, data: { fingerprintTolerance, graceDays, allowTrial, trialDays } }
Fonte: variáveis de ambiente/config do servidor.
POST /api/license/backup (opcional)
Entrada: { deviceId, reason }
Efeitos: salva snapshot em LicenseBackup.
Retorno: { success, data: { backupId } }
GET /api/license/backups?deviceId=... (opcional)
Retorno: { success, data: Array<{ id, createdAt, reason, preview? } > }
POST /api/license/restore (opcional)
Entrada: { backupId }
Efeitos: restaura License/LicenseDevice a partir do snapshot selecionado.
Retorno: { success, data: LicenseView }
Erros e status:
400 (entrada inválida), 401/403 (se depois você exigir auth), 404 (não encontrado), 409 (conflito), 500 (erro interno).
Corpo: { success: false, error: 'mensagem', code?: '...' }
Segurança mínima:
Não expor segredos no client.
Validar licenseKey no servidor (nada de “master key” no front).
Rate limiting em /activate e /heartbeat.
CORS: mesmo domínio do app; logs auditáveis para ativações e mudanças de fingerprint.
Fase 3 — Inversor de fluxo no LicenseManager (cliente)
Objetivo: remover localStorage; sempre consultar/persistir no servidor; cache apenas na memória da sessão.
Inicialização:
Gerar deviceId (fingerprint).
Chamar GET /api/license?deviceId=... e popular estado local (memória) com LicenseView.
Se não existir licença → UI orienta ativação (form para licenseKey).
Ativação:
Coletar licenseKey + deviceId + deviceInfo e chamar POST /api/license/activate.
Receber LicenseView e atualizar estado.
Heartbeat:
Intervalo (ex.: a cada 5–10 min) ou em eventos (foco/visibilidade), enviar PUT /api/license/heartbeat com { deviceId, fingerprint, similarity }.
Atualizar estado conforme resposta (status/daysRemaining podem mudar).
Política:
Carregar GET /api/license/policy uma vez e guardar para uso do Manager (limiar de similaridade, dias de graça, etc.).
Cache em memória:
Estado React/contexto ou variável de módulo.
Revalidar quando a aba volta ao foco (document.visibilitychange).
Offline:
Sem armazenamento local, o uso offline só funciona se já houver estado em memória (mesma aba). Após limpeza e sem rede, não há como restaurar. Se precisar de offline no futuro, usar token assinado com expiração curta (isso reintroduz dado local).
Remoções:
Eliminar localStorage para licença, backups, flags.
Remover “MASTER_LICENSES” e bypass (somente no servidor, se necessário, e apenas em dev).
Fase 4 — Ferramentas de recuperação (servidor primeiro)
Backups:
Usar POST /api/license/backup e GET /api/license/backups (+ restore) no lugar de localStorage.
Diagnóstico:
“Quick”: consegue gerar deviceId? consegue chamar GET /api/license? encontra LicenseView?
“Complete”: checar políticas, status da licença (active/expired/revoked), últimos heartbeats, similaridade do fingerprint atual vs histórico (retornados pelo servidor).
Suporte interno:
Opcional: página interna, protegida (ex.: Basic Auth ou role ADMIN), para rodar diagnóstico e acionar backup/restore.
Variáveis ​​de ambiente sugeridas (servidor)
DATABASE_URL (banco remoto)
LICENSE_FP_TOLERANCE (ex.: 0.4)
LICENSE_GRACE_DAYS (ex.: 3)
LICENSE_ALLOW_TRIAL (true/false)
LICENSE_TRIAL_DAYS (ex.: 90)
Testículos (matriz mínima)
Novo dispositivo sem licença:
GET retorna 404/hasLicense: false → ativar → GET passa a retornar LicenseView.
Trial:
Ativar trial → dias restantes decrementar; expiração vira ‘expired’.
Mudança de fingerprint:
Enviar heartbeat com similarity baixa → servidor grava no histórico; se dentro da tolerância/grace, mantém ativo.
Limpar cache do navegador:
Reabrir → GET carrega do servidor (licença mantida).
Backup/restore (opcional):
Criar backup, alterar estado, restaurar e verificar.
Implantação e monitoramento
Confirmar no Vercel:
DATABASE_URL setado em Production/Preview.
Build command incluindo migrate deploy.
Observabilidade:
Logar ativações, heartbeats, mudanças de status e eventos de restore.
Alerte em taxas anormais de ativações/heartbeats (ratelimit).
Próximos passos imediatos
Validar provider do banco em produção e setar DATABASE_URL.
Criar as tabelas (License, LicenseDevice e, se quiser, LicenseBackup) e comitar as migrações.
Implementar os endpoints conforme contratos acima (começar por GET /api/license e POST /api/license/activate).
Inverter o LicenseManager para usar esses endpoints (sem localStorage) e ajustar a página /license para consumir o LicenseView.
Só depois, adicionar heartbeat e (se optar) backups/diagnóstico no servidor.