@echo off
setlocal enabledelayedexpansion
title Representatives App - Preparação para Build
color 0A

echo ========================================
echo   REPRESENTATIVES APP - BUILD SETUP
echo   Preparando ambiente para produção
echo ========================================
echo.

REM Definir diretório base
set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

REM Verificar se Node.js está instalado
echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo Por favor, instale o Node.js versão 18 ou superior.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

REM Limpar builds anteriores
echo.
echo [2/8] Limpando builds anteriores...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Pasta .next removida
)
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Pasta dist removida
)

REM Instalar dependências
echo.
echo [3/8] Instalando dependências...
call npm install --production=false
if %errorlevel% neq 0 (
    echo ❌ ERRO: Falha ao instalar dependências!
    pause
    exit /b 1
)
echo ✅ Dependências instaladas

REM Gerar Prisma Client
echo.
echo [4/8] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ ERRO: Falha ao gerar Prisma Client!
    pause
    exit /b 1
)
echo ✅ Prisma Client gerado

REM Criar diretório de dados se não existir
echo.
echo [5/8] Criando estrutura de diretórios...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo ✅ Diretórios criados

REM Criar banco de dados SQLite
echo.
echo [6/8] Preparando banco de dados...
call npx prisma db push --skip-generate
if %errorlevel% neq 0 (
    echo ⚠️ Aviso: Banco de dados já existe ou não pôde ser criado
    echo Continuando...
)
echo ✅ Banco de dados preparado

REM Build do Next.js para produção
echo.
echo [7/8] Compilando aplicação para produção...
echo Isso pode demorar alguns minutos...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERRO: Falha na compilação!
    echo Verifique os erros acima e tente novamente.
    pause
    exit /b 1
)
echo ✅ Build de produção concluída

REM Verificar se a build foi criada
echo.
echo [8/8] Verificando build...
if not exist ".next" (
    echo ❌ ERRO: Pasta .next não foi criada!
    pause
    exit /b 1
)
echo ✅ Build verificada com sucesso

echo.
echo ========================================
echo   ✅ PREPARAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Próximos passos:
echo 1. Execute 'download-node-portable.bat' para baixar Node.js portátil
echo 2. Execute 'create-installer.bat' para criar o instalador
echo.
pause