#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

class RepresentativesAppHotfix {
  constructor() {
    this.appName = 'RepresentativesApp';
    this.version = '1.0.2.1';
    this.installPath = null;
    this.backupPath = null;
    this.logMessages = [];
    
    // Arquivos que serão atualizados
    this.filesToUpdate = [
      {
        source: 'license-manager.js',
        target: '.next/server/chunks/[id].js', // Caminho será detectado dinamicamente
        description: 'Sistema de licenciamento corrigido'
      },
      {
        source: 'license-recovery.js', 
        target: '.next/server/chunks/[id].js', // Novo arquivo
        description: 'Ferramentas de recuperação'
      },
      {
        source: 'layout.js',
        target: '.next/server/app/layout.js',
        description: 'Interface com bypass automático'
      }
    ];
  }

  // 📝 Sistema de logging
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.logMessages.push(logEntry);
    
    const prefix = {
      'info': '✅',
      'warning': '⚠️', 
      'error': '❌',
      'progress': '🔄'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  // 🔍 Detectar instalação existente
  async detectInstallation() {
    this.log('Detectando instalação do Representatives App...', 'progress');
    
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Local', this.appName),
      path.join(os.homedir(), 'AppData', 'Roaming', this.appName),
      path.join('C:', 'Program Files', this.appName),
      path.join('C:', 'Program Files (x86)', this.appName),
      path.join(os.homedir(), 'Desktop', this.appName),
      path.join(os.homedir(), 'Downloads', this.appName)
    ];

    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          // Verificar se é uma instalação válida
          const markers = [
            path.join(testPath, '.next'),
            path.join(testPath, 'package.json'),
            path.join(testPath, 'node-portable'),
            path.join(testPath, 'server.js')
          ];
          
          const validMarkers = markers.filter(marker => fs.existsSync(marker));
          
          if (validMarkers.length >= 2) {
            this.installPath = testPath;
            this.log(`Instalação encontrada: ${testPath}`, 'info');
            
            // Verificar versão se possível
            try {
              const packagePath = path.join(testPath, 'package.json');
              if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                this.log(`Versão atual: ${packageData.version || 'desconhecida'}`, 'info');
              }
            } catch (error) {
              // Ignorar erro de versão
            }
            
            return true;
          }
        }
      } catch (error) {
        // Continuar procurando
      }
    }

    this.log('❌ Instalação do Representatives App não encontrada!', 'error');
    this.log('Certifique-se de que o aplicativo está instalado antes de executar este hotfix.', 'error');
    return false;
  }

  // 💾 Criar backup dos arquivos atuais
  async createBackup() {
    this.log('Criando backup dos arquivos atuais...', 'progress');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = path.join(this.installPath, 'backup', `hotfix-backup-${timestamp}`);
    
    try {
      // Criar diretório de backup
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      let backedUpFiles = 0;
      
      // Backup do diretório .next completo (compactado)
      const nextPath = path.join(this.installPath, '.next');
      if (fs.existsSync(nextPath)) {
        const backupNextPath = path.join(this.backupPath, '.next');
        await this.copyDirectory(nextPath, backupNextPath);
        backedUpFiles++;
        this.log('Backup do build Next.js criado', 'info');
      }

      // Backup de arquivos importantes individuais
      const importantFiles = [
        'package.json',
        'server.js', 
        '.env'
      ];

      for (const file of importantFiles) {
        const sourcePath = path.join(this.installPath, file);
        const backupFilePath = path.join(this.backupPath, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, backupFilePath);
          backedUpFiles++;
        }
      }

      // Criar arquivo de informações do backup
      const backupInfo = {
        timestamp: new Date().toISOString(),
        version: this.version,
        installPath: this.installPath,
        backedUpFiles: backedUpFiles,
        reason: 'Hotfix v1.0.2.1 - Correção do sistema de licenciamento'
      };
      
      fs.writeFileSync(
        path.join(this.backupPath, 'backup-info.json'), 
        JSON.stringify(backupInfo, null, 2)
      );

      this.log(`Backup criado: ${this.backupPath}`, 'info');
      this.log(`${backedUpFiles} arquivos salvos no backup`, 'info');
      return true;
      
    } catch (error) {
      this.log(`Erro ao criar backup: ${error.message}`, 'error');
      return false;
    }
  }

  // 📁 Copiar diretório recursivamente
  async copyDirectory(source, destination) {
    try {
      fs.mkdirSync(destination, { recursive: true });
      
      const items = fs.readdirSync(source);
      
      for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        
        const stat = fs.statSync(sourcePath);
        
        if (stat.isDirectory()) {
          await this.copyDirectory(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    } catch (error) {
      throw new Error(`Erro ao copiar diretório: ${error.message}`);
    }
  }

  // 🔍 Encontrar arquivos específicos no build Next.js
  findNextJSFiles() {
    this.log('Mapeando arquivos do build Next.js...', 'progress');
    
    const nextPath = path.join(this.installPath, '.next');
    const fileMap = new Map();
    
    try {
      // Encontrar layout.js
      const layoutPaths = [
        path.join(nextPath, 'server', 'app', 'layout.js'),
        path.join(nextPath, 'static', 'chunks', 'app', 'layout.js')
      ];
      
      for (const layoutPath of layoutPaths) {
        if (fs.existsSync(layoutPath)) {
          fileMap.set('layout', layoutPath);
          this.log(`Layout encontrado: ${path.relative(this.installPath, layoutPath)}`, 'info');
          break;
        }
      }

      // Encontrar arquivos de lib (license-manager)
      const libPath = path.join(nextPath, 'server', 'chunks');
      if (fs.existsSync(libPath)) {
        const chunkFiles = this.findFilesByContent(libPath, 'LicenseManager');
        if (chunkFiles.length > 0) {
          fileMap.set('license-manager', chunkFiles[0]);
          this.log(`License Manager encontrado: ${path.relative(this.installPath, chunkFiles[0])}`, 'info');
        }
      }

      return fileMap;
      
    } catch (error) {
      this.log(`Erro ao mapear arquivos: ${error.message}`, 'error');
      return new Map();
    }
  }

  // 🔍 Encontrar arquivos por conteúdo
  findFilesByContent(directory, searchText, maxDepth = 3) {
    const results = [];
    
    if (maxDepth <= 0) return results;
    
    try {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const itemPath = path.join(directory, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          results.push(...this.findFilesByContent(itemPath, searchText, maxDepth - 1));
        } else if (item.endsWith('.js')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            if (content.includes(searchText)) {
              results.push(itemPath);
            }
          } catch (error) {
            // Ignorar arquivos que não podem ser lidos
          }
        }
      }
    } catch (error) {
      // Ignorar diretórios que não podem ser lidos
    }
    
    return results;
  }

  // 🔄 Aplicar arquivos corrigidos
  async applyUpdates() {
    this.log('Aplicando correções...', 'progress');
    
    try {
      const fileMap = this.findNextJSFiles();
      let updatedFiles = 0;

      // Diretório onde estão os arquivos de correção
      const hotfixDir = path.join(__dirname, 'hotfix-files');
      
      if (!fs.existsSync(hotfixDir)) {
        throw new Error('Diretório de correções não encontrado!');
      }

      // Aplicar Layout corrigido
      const layoutSource = path.join(hotfixDir, 'layout.js');
      const layoutTarget = fileMap.get('layout');
      
      if (fs.existsSync(layoutSource) && layoutTarget) {
        fs.copyFileSync(layoutSource, layoutTarget);
        updatedFiles++;
        this.log('Layout atualizado', 'info');
      }

      // Aplicar License Manager corrigido
      const licenseSource = path.join(hotfixDir, 'license-manager.js');
      const licenseTarget = fileMap.get('license-manager');
      
      if (fs.existsSync(licenseSource) && licenseTarget) {
        fs.copyFileSync(licenseSource, licenseTarget);
        updatedFiles++;
        this.log('License Manager atualizado', 'info');
      }

      // Adicionar License Recovery (novo arquivo)
      const recoverySource = path.join(hotfixDir, 'license-recovery.js');
      if (fs.existsSync(recoverySource) && licenseTarget) {
        // Inserir recovery no mesmo chunk do license manager
        const licenseContent = fs.readFileSync(licenseTarget, 'utf8');
        const recoveryContent = fs.readFileSync(recoverySource, 'utf8');
        
        // Combinar os arquivos
        const combinedContent = licenseContent + '\n\n' + recoveryContent;
        fs.writeFileSync(licenseTarget, combinedContent);
        updatedFiles++;
        this.log('License Recovery adicionado', 'info');
      }

      if (updatedFiles > 0) {
        this.log(`${updatedFiles} arquivos atualizados com sucesso`, 'info');
        return true;
      } else {
        throw new Error('Nenhum arquivo foi atualizado');
      }
      
    } catch (error) {
      this.log(`Erro ao aplicar atualizações: ${error.message}`, 'error');
      return false;
    }
  }

  // ✅ Verificar se a atualização funcionou
  async verifyUpdate() {
    this.log('Verificando se a atualização funcionou...', 'progress');
    
    try {
      const fileMap = this.findNextJSFiles();
      
      // Verificar se os arquivos atualizados contêm as correções
      const layoutFile = fileMap.get('layout');
      const licenseFile = fileMap.get('license-manager');
      
      let verificationsPassed = 0;
      
      if (layoutFile && fs.existsSync(layoutFile)) {
        const layoutContent = fs.readFileSync(layoutFile, 'utf8');
        if (layoutContent.includes('checkEnvironmentBypass') || layoutContent.includes('LICENSE_VALID')) {
          verificationsPassed++;
          this.log('✓ Layout com bypass detectado', 'info');
        }
      }
      
      if (licenseFile && fs.existsSync(licenseFile)) {
        const licenseContent = fs.readFileSync(licenseFile, 'utf8');
        if (licenseContent.includes('generateStableFingerprint') || licenseContent.includes('STABLE-')) {
          verificationsPassed++;
          this.log('✓ Sistema de fingerprint estável detectado', 'info');
        }
        if (licenseContent.includes('attemptSmartRecovery') || licenseContent.includes('RecoveryTools')) {
          verificationsPassed++;
          this.log('✓ Sistema de recuperação detectado', 'info');
        }
      }

      if (verificationsPassed >= 2) {
        this.log('✅ Atualização aplicada com sucesso!', 'info');
        return true;
      } else {
        this.log('⚠️ Atualização pode não ter sido aplicada corretamente', 'warning');
        return false;
      }
      
    } catch (error) {
      this.log(`Erro na verificação: ${error.message}`, 'error');
      return false;
    }
  }

  // 📊 Gerar relatório final
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: this.version,
      installPath: this.installPath,
      backupPath: this.backupPath,
      success: true,
      logs: this.logMessages
    };

    try {
      const reportPath = path.join(this.installPath, 'hotfix-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Relatório salvo: ${reportPath}`, 'info');
    } catch (error) {
      this.log(`Aviso: Não foi possível salvar relatório: ${error.message}`, 'warning');
    }

    return report;
  }

  // 🚀 Executar hotfix completo
  async run() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                Representatives App - Hotfix v${this.version}               ║
║              Correção do Sistema de Licenciamento            ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // Etapa 1: Detectar instalação
      const installationFound = await this.detectInstallation();
      if (!installationFound) {
        process.exit(1);
      }

      // Etapa 2: Criar backup
      const backupCreated = await this.createBackup();
      if (!backupCreated) {
        this.log('❌ Falha ao criar backup. Interrompendo atualização por segurança.', 'error');
        process.exit(1);
      }

      // Etapa 3: Aplicar correções
      const updatesApplied = await this.applyUpdates();
      if (!updatesApplied) {
        this.log('❌ Falha ao aplicar correções.', 'error');
        this.log('💾 Backup disponível em: ' + this.backupPath, 'info');
        process.exit(1);
      }

      // Etapa 4: Verificar
      const verificationPassed = await this.verifyUpdate();
      
      // Etapa 5: Relatório final
      this.generateReport();

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      ✅ HOTFIX CONCLUÍDO                      ║
╚══════════════════════════════════════════════════════════════╝

🎯 O que foi corrigido:
   • Sistema de licenciamento estável
   • Fingerprinting resistente a mudanças
   • Comandos de recuperação via console
   • Bypass automático quando configurado

🔧 Próximos passos:
   1. Reinicie o Representatives App
   2. O problema "Dispositivo alterado" foi resolvido
   3. Use F12 + Console: window.RepApp.help() para ver comandos

📁 Executado de: ${__dirname}
💾 Backup criado em: ${this.backupPath}
📋 Instalação: ${this.installPath}

${verificationPassed ? '✅ Todas as verificações passaram!' : '⚠️ Algumas verificações falharam - teste o app'}
`);

    } catch (error) {
      this.log(`❌ Erro crítico: ${error.message}`, 'error');
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      ❌ HOTFIX FALHOU                         ║
╚══════════════════════════════════════════════════════════════╝

Entre em contato com o suporte técnico com as informações acima.
${this.backupPath ? 'Backup disponível em: ' + this.backupPath : ''}
`);
      process.exit(1);
    }
  }
}

// Executar hotfix se chamado diretamente
if (require.main === module) {
  const hotfix = new RepresentativesAppHotfix();
  hotfix.run().catch(console.error);
}

module.exports = RepresentativesAppHotfix;