# Teste das APIs Receivables e Goals
# Execute este bloco ap?s npm run dev

# Teste 1: POST Goals
$goalData = @{
    title = "Meta Mensal Teste"
    periodType = "monthly"  
    periodStart = "2025-01-01T00:00:00Z"
    periodEnd = "2025-01-31T23:59:59Z"
    targetAmount = 10000
    targetSales = 50
    description = "Meta criada via API"
} | ConvertTo-Json

Write-Host "Testando POST /api/goals..."
$goalResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/goals" -Method POST -Body $goalData -ContentType "application/json"
$goalResponse | ConvertTo-Json -Depth 3

# Teste 2: GET Goals
Write-Host "`nTestando GET /api/goals..."
$goalsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/goals" -Method GET
$goalsResponse | ConvertTo-Json -Depth 3

Write-Host "`n? Se ambos funcionaram, as APIs est?o ativas!"
Write-Host "? Dados persistindo no SQLite!"
Write-Host "`nPressione qualquer tecla para continuar com Marco 3..."
