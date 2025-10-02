@echo off
setlocal enabledelayedexpansion
title Representatives App - Download Node.js Portátil
color 0A

echo ========================================
echo   DOWNLOAD NODE.JS PORTÁTIL
echo   Versão 20.18.1 LTS (Windows x64)
echo ========================================
echo.

REM Definir variáveis
set NODE_VERSION=v20.18.1
set NODE_DIST=node-%NODE_VERSION%-win-x64
set NODE_ZIP=%NODE_DIST%.zip
set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_ZIP%
set INSTALLER_DIR=%~dp0installer
set NODE_DIR=%INSTALLER_DIR%\node-portable

REM Criar diretório do instalador
echo [1/5] Criando diretório do instalador...
if not exist "%INSTALLER_DIR%" mkdir "%INSTALLER_DIR%"
cd /d "%INSTALLER_DIR%"
echo ✅ Diretório criado: %INSTALLER_DIR%

REM Verificar se já existe
if exist "%NODE_DIR%" (
    echo.
    echo ⚠️ Node.js portátil já existe em %NODE_DIR%
    echo Deseja baixar novamente? (S/N)
    set /p CONFIRM=
    if /i "!CONFIRM!" neq "S" (
        echo Operação cancelada.
        pause
        exit /b 0
    )
    echo Removendo versão anterior...
    rmdir /s /q "%NODE_DIR%"
)

REM Baixar Node.js
echo.
echo [2/5] Baixando Node.js %NODE_VERSION%...
echo URL: %NODE_URL%
echo.
echo Isso pode demorar alguns minutos dependendo da sua conexão...

REM Tentar com curl (Windows 10+)
curl --version >nul 2>&1
if %errorlevel% equ 0 (
    curl -L -o "%NODE_ZIP%" "%NODE_URL%"
) else (
    REM Fallback para PowerShell
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'}"
)

if not exist "%NODE_ZIP%" (
    echo ❌ ERRO: Falha ao baixar Node.js!
    echo Tente baixar manualmente de:
    echo %NODE_URL%
    pause
    exit /b 1
)
echo ✅ Download concluído

REM Extrair arquivo
echo.
echo [3/5] Extraindo arquivos...
powershell -Command "& {Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '.' -Force}"
if %errorlevel% neq 0 (
    echo ❌ ERRO: Falha ao extrair arquivos!
    pause
    exit /b 1
)
echo ✅ Arquivos extraídos

REM Renomear pasta
echo.
echo [4/5] Organizando arquivos...
if exist "%NODE_DIST%" (
    rename "%NODE_DIST%" "node-portable"
    if %errorlevel% neq 0 (
        echo ❌ ERRO: Falha ao renomear pasta!
        pause
        exit /b 1
    )
)
echo ✅ Arquivos organizados

REM Limpar arquivo ZIP
echo.
echo [5/5] Limpando arquivos temporários...
del /q "%NODE_ZIP%"
echo ✅ Limpeza concluída

REM Verificar instalação
echo.
echo Verificando instalação...
if exist "%NODE_DIR%\node.exe" (
    "%NODE_DIR%\node.exe" --version
    echo ✅ Node.js portátil instalado com sucesso!
) else (
    echo ❌ ERRO: Node.js não foi instalado corretamente!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ DOWNLOAD CONCLUÍDO!
echo ========================================
echo.
echo Node.js portátil instalado em:
echo %NODE_DIR%
echo.
echo Próximo passo:
echo Execute 'create-installer.bat' para criar o instalador
echo.
pause