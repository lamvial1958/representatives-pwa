@echo off
setlocal enabledelayedexpansion
title Representatives App - Criar Instalador
color 0A

echo ========================================
echo   CRIAR INSTALADOR - REPRESENTATIVES APP
echo   Versão 1.0.1
echo ========================================
echo.

REM Definir diretórios
set BASE_DIR=%~dp0
set INSTALLER_DIR=%BASE_DIR%installer
set OUTPUT_DIR=%INSTALLER_DIR%\output

cd /d "%BASE_DIR%"

REM Verificar pré-requisitos
echo [1/7] Verificando pré-requisitos...
echo.

REM Verificar build do Next.js
if not exist ".next" (
    echo ❌ ERRO: Build de produção não encontrada!
    echo.
    echo Execute primeiro: prepare-build.bat
    echo.
    pause
    exit /b 1
)
echo ✅ Build de produção encontrada

REM Verificar node_modules
if not exist "node_modules" (
    echo ❌ ERRO: Dependências não encontradas!
    echo.
    echo Execute primeiro: npm install
    echo.
    pause
    exit /b 1
)
echo ✅ Dependências encontradas

REM Verificar Node.js portátil
if not exist "%INSTALLER_DIR%\node-portable\node.exe" (
    echo ❌ ERRO: Node.js portátil não encontrado!
    echo.
    echo Execute primeiro: download-node-portable.bat
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js portátil encontrado

REM Verificar Inno Setup
echo.
echo [2/7] Verificando Inno Setup...
set INNO_PATH=
for %%p in (
    "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
    "%ProgramFiles%\Inno Setup 6\ISCC.exe"
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
    "C:\Program Files\Inno Setup 6\ISCC.exe"
) do (
    if exist %%p (
        set INNO_PATH=%%p
        goto :found_inno
    )
)

echo ❌ ERRO: Inno Setup não encontrado!
echo.
echo Por favor, instale o Inno Setup 6:
echo https://www.jrsoftware.org/isdl.php
echo.
pause
exit /b 1

:found_inno
echo ✅ Inno Setup encontrado: %INNO_PATH%

REM Criar diretório de saída
echo.
echo [3/7] Preparando diretórios...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
echo ✅ Diretório de saída criado

REM Verificar arquivos do servidor no diretório do instalador
echo.
echo [4/7] Verificando arquivos do servidor...

REM Verificar se server.js existe em installer
if not exist "%INSTALLER_DIR%\server.js" (
    echo ❌ ERRO: server.js não encontrado em installer!
    echo Por favor, salve o server.js melhorado na pasta installer
    pause
    exit /b 1
)
echo ✅ server.js encontrado

REM Criar start.bat em installer (já que foi eliminado)
echo Criando start.bat...
(
    echo @echo off
    echo title Representatives App - Sistema de Representantes Comerciais
    echo color 0A
    echo echo.
    echo echo ========================================
    echo echo   REPRESENTATIVES APP v1.0.1
    echo echo   Sistema de Representantes Comerciais
    echo echo ========================================
    echo echo.
    echo echo Iniciando aplicação...
    echo echo.
    echo.
    echo cd /d "%%~dp0"
    echo.
    echo if not exist "logs" mkdir logs
    echo.
    echo if exist "node\node.exe" ^(
    echo     echo Iniciando servidor...
    echo     node\node.exe server.js
    echo ^) else ^(
    echo     echo ERRO: Node.js não encontrado!
    echo     pause
    echo     exit /b 1
    echo ^)
) > "%INSTALLER_DIR%\start.bat"
echo ✅ start.bat criado

echo ✅ Arquivos do servidor preparados

REM Criar arquivo de licença se não existir
echo.
echo [5/7] Verificando arquivos adicionais...
if not exist "LICENSE.txt" (
    echo Criando arquivo de licença padrão...
    (
        echo Representatives App - Licença de Uso
        echo =====================================
        echo.
        echo Copyright 2025 Vial ^& Monticelli
        echo.
        echo Este software é propriedade de Vial ^& Monticelli.
        echo Todos os direitos reservados.
        echo.
        echo Termos de Uso:
        echo - Licença individual para uso comercial
        echo - Proibida a redistribuição sem autorização
        echo - Suporte técnico incluído
        echo.
    ) > LICENSE.txt
)
echo ✅ Arquivos adicionais verificados

REM Compilar instalador
echo.
echo [6/7] Compilando instalador...
echo Isso pode demorar alguns minutos...
echo.

%INNO_PATH% "%INSTALLER_DIR%\setup.iss" /Q

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Falha ao compilar instalador!
    echo.
    echo Verifique:
    echo 1. Se o arquivo setup.iss está correto
    echo 2. Se todos os arquivos necessários existem
    echo 3. Os logs do Inno Setup para mais detalhes
    echo.
    pause
    exit /b 1
)

REM Verificar se o instalador foi criado
echo.
echo [7/7] Verificando instalador...
if exist "%OUTPUT_DIR%\RepresentativesApp-Setup-v1.0.1.exe" (
    echo ✅ Instalador criado com sucesso!
    
    REM Calcular tamanho do arquivo
    for %%A in ("%OUTPUT_DIR%\RepresentativesApp-Setup-v1.0.1.exe") do set SIZE=%%~zA
    set /a SIZE_MB=!SIZE! / 1048576
    
    echo.
    echo ========================================
    echo   ✅ INSTALADOR CRIADO COM SUCESSO!
    echo ========================================
    echo.
    echo 📦 Arquivo: RepresentativesApp-Setup-v1.0.1.exe
    echo 📁 Local: %OUTPUT_DIR%
    echo 💾 Tamanho: ~!SIZE_MB! MB
    echo.
    echo O instalador está pronto para distribuição!
    echo.
    
    REM Perguntar se deseja abrir a pasta
    echo Deseja abrir a pasta do instalador? (S/N)
    set /p OPEN_FOLDER=
    if /i "!OPEN_FOLDER!"=="S" (
        explorer "%OUTPUT_DIR%"
    )
) else (
    echo ❌ ERRO: Instalador não foi criado!
    echo.
    echo Verifique os logs para mais informações.
)

echo.
pause