'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function HelpPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('overview');

  const menuItems = [
    { id: 'overview', label: '🏠 Visão Geral', icon: '🏠' },
    { id: 'start', label: '🚀 Como Começar', icon: '🚀' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'clients', label: '👥 Clientes', icon: '👥' },
    { id: 'sales', label: '💰 Vendas', icon: '💰' },
    { id: 'receivables', label: '💳 Contas a Receber', icon: '💳' },
    { id: 'goals', label: '🎯 Objetivos', icon: '🎯' },
    { id: 'commissions', label: '💎 Comissões', icon: '💎' },
    { id: 'products', label: '📦 Produtos', icon: '📦' },
    { id: 'visits', label: '🚗 Visitas', icon: '🚗' },
    { id: 'reports', label: '📊 Relatórios', icon: '📊' },
    { id: 'tips', label: '💡 Dicas', icon: '💡' },
    { id: 'troubleshooting', label: '🆘 Problemas', icon: '🆘' }
  ];

  const renderSection = () => {
    switch(activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-xl">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">⚠️</span>
                <h2 className="text-2xl font-bold text-yellow-800">VERSÃO DE TESTE - 90 DIAS</h2>
              </div>
              <p className="text-yellow-700">
                Esta é uma versão de avaliação do Representatives App com todas as funcionalidades disponíveis. 
                Válida por 90 dias a partir da instalação.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">🎯 Bem-vindo ao Representatives App!</h2>
              <p className="text-blue-700">
                Sistema CRM completo desenvolvido especialmente para representantes comerciais. 
                Com 9 módulos integrados, você tem controle total sobre clientes, vendas, comissões e muito mais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">✨ Principais Funcionalidades</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✅ Gestão completa de clientes com CRM</li>
                  <li>✅ Sistema de vendas com cálculos automáticos</li>
                  <li>✅ Controle de contas a receber</li>
                  <li>✅ Análise detalhada de comissões</li>
                  <li>✅ Objetivos e metas personalizáveis</li>
                  <li>✅ Catálogo de produtos</li>
                  <li>✅ Sistema de visitas</li>
                  <li>✅ Relatórios executivos</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Requisitos Mínimos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>💻 Windows 10/11 (64-bit)</li>
                  <li>🧠 4 GB RAM (8 GB recomendado)</li>
                  <li>💾 300 MB de espaço em disco</li>
                  <li>🌐 Navegador moderno (Chrome, Edge, Firefox)</li>
                  <li>🖥️ Resolução 1366x768 ou superior</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'start':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">🚀 Como Começar</h2>
            
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4">Primeiros Passos</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold">Execute o Representatives App</p>
                    <p className="text-gray-600 text-sm">Clique no ícone do desktop ou menu iniciar</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold">Aguarde o sistema iniciar</p>
                    <p className="text-gray-600 text-sm">Uma janela preta aparecerá (não feche!) e o navegador abrirá</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <div>
                    <p className="font-semibold">Cadastre seus primeiros clientes</p>
                    <p className="text-gray-600 text-sm">Vá em Clientes e clique em "+ Cliente"</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">4</span>
                  <div>
                    <p className="font-semibold">Registre suas vendas</p>
                    <p className="text-gray-600 text-sm">Use o botão "$ Venda" para adicionar vendas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <p className="text-yellow-800">
                <strong>⚠️ Importante:</strong> Não feche a janela preta (console) - ela mantém o sistema rodando!
              </p>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">📊 Dashboard - Visão Executiva</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">O que você encontra no Dashboard:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">📈</span>
                  <div>
                    <strong>Cards de Métricas:</strong> Clientes totais, vendas do mês, receita e comissões
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">💰</span>
                  <div>
                    <strong>Análise de Comissões:</strong> Destaque especial com valores ganhos
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">🎯</span>
                  <div>
                    <strong>Objetivos Mensais:</strong> Progresso visual das suas metas
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">📊</span>
                  <div>
                    <strong>Projeções:</strong> Estimativas baseadas no desempenho atual
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                <strong>💡 Dica:</strong> Use o Dashboard diariamente para acompanhar seu desempenho e identificar oportunidades!
              </p>
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">👥 Clientes - CRM Avançado</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Como Cadastrar um Cliente:</h3>
              <ol className="space-y-3">
                <li><strong>1.</strong> Clique em "+ Cliente" no menu ou na página</li>
                <li><strong>2.</strong> Preencha os dados obrigatórios (nome, email, telefone)</li>
                <li><strong>3.</strong> Defina o perfil do cliente (Decisor, Técnico, Comprador)</li>
                <li><strong>4.</strong> Escolha o segmento (Premium, Standard, Prospect)</li>
                <li><strong>5.</strong> Configure preferências de comunicação</li>
                <li><strong>6.</strong> Adicione observações importantes</li>
                <li><strong>7.</strong> Clique em "Criar" para salvar</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold text-green-800 mb-2">✅ Funcionalidades:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Timeline de contatos</li>
                  <li>• Histórico de interações</li>
                  <li>• Segmentação avançada</li>
                  <li>• Busca e filtros</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">💡 Dicas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mantenha dados atualizados</li>
                  <li>• Registre todos os contatos</li>
                  <li>• Use segmentação</li>
                  <li>• Agende follow-ups</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">💰 Vendas - Sistema Completo</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Como Registrar uma Venda:</h3>
              <ol className="space-y-3">
                <li><strong>1.</strong> Clique em "$ Venda" no menu</li>
                <li><strong>2.</strong> Selecione o cliente da lista</li>
                <li><strong>3.</strong> Descreva o produto/serviço vendido</li>
                <li><strong>4.</strong> Informe quantidade e preço unitário</li>
                <li><strong>5.</strong> Configure a taxa de comissão (%)</li>
                <li><strong>6.</strong> Escolha o método de pagamento</li>
                <li><strong>7.</strong> Defina o status (Pago, Pendente)</li>
                <li><strong>8.</strong> Clique em "Registrar Venda"</li>
              </ol>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800">
                <strong>💎 Benefício:</strong> O sistema calcula automaticamente o valor total e sua comissão!
              </p>
            </div>
          </div>
        );

      case 'receivables':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">💳 Contas a Receber</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Controle Financeiro Completo:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">📊 Dashboard Financeiro:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Total a receber</li>
                    <li>• Contas vencidas</li>
                    <li>• Vencimentos próximos</li>
                    <li>• Taxa de inadimplência</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚡ Ações Rápidas:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Marcar como pago</li>
                    <li>• Renegociar valores</li>
                    <li>• Enviar cobrança</li>
                    <li>• Calcular juros</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800">
                <strong>⚠️ Importante:</strong> Mantenha o controle de recebíveis atualizado diariamente!
              </p>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">🎯 Objetivos - Metas Flexíveis</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tipos de Objetivos:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl">⚡</span>
                  <p className="font-semibold mt-2">Diário</p>
                  <p className="text-sm text-gray-600">Meta do dia</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <span className="text-2xl">📊</span>
                  <p className="font-semibold mt-2">Semanal</p>
                  <p className="text-sm text-gray-600">Meta da semana</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-2xl">📅</span>
                  <p className="font-semibold mt-2">Mensal</p>
                  <p className="text-sm text-gray-600">Meta do mês</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <span className="text-2xl">🎯</span>
                  <p className="font-semibold mt-2">Personalizado</p>
                  <p className="text-sm text-gray-600">Qualquer período</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800">
                <strong>💡 Exemplo:</strong> Crie metas personalizadas para Black Friday, campanhas específicas ou trimestres!
              </p>
            </div>
          </div>
        );

      case 'commissions':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">💎 Comissões - Análise Detalhada</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Análises Disponíveis:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">💰</span>
                  <div>
                    <strong>Total de Comissões:</strong> Valor total ganho no período
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <div>
                    <strong>Comissões Pagas:</strong> Valores já recebidos
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⏳</span>
                  <div>
                    <strong>Comissões Pendentes:</strong> Valores a receber
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">📊</span>
                  <div>
                    <strong>Performance:</strong> Rankings e comparações
                  </div>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">📦 Produtos - Catálogo</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Gestão de Produtos:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">📝 Informações:</h4>
                  <ul className="text-sm text-gray-700">
                    <li>• Nome e SKU</li>
                    <li>• Descrição</li>
                    <li>• Categoria</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">💰 Valores:</h4>
                  <ul className="text-sm text-gray-700">
                    <li>• Preço de venda</li>
                    <li>• Custo</li>
                    <li>• Comissão (%)</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Controle:</h4>
                  <ul className="text-sm text-gray-700">
                    <li>• Estoque</li>
                    <li>• Status</li>
                    <li>• Tags</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'visits':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">🚗 Visitas - Agenda</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tipos de Visita:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-3xl">🏢</span>
                  <p className="font-semibold mt-2">Presencial</p>
                  <p className="text-sm text-gray-600">Visita no local do cliente</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <span className="text-3xl">📹</span>
                  <p className="font-semibold mt-2">Videochamada</p>
                  <p className="text-sm text-gray-600">Reunião online</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-3xl">📞</span>
                  <p className="font-semibold mt-2">Ligação</p>
                  <p className="text-sm text-gray-600">Contato telefônico</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">📊 Relatórios - Insights</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Análises Disponíveis:</h3>
              <ul className="space-y-3">
                <li>📈 <strong>Performance por período:</strong> Evolução temporal</li>
                <li>🎯 <strong>Status de vendas:</strong> Breakdown por situação</li>
                <li>🗺️ <strong>Análise regional:</strong> Performance por estado</li>
                <li>📦 <strong>Produtos mais vendidos:</strong> Ranking de produtos</li>
                <li>💳 <strong>Inadimplência:</strong> Análise de recebíveis</li>
              </ul>
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">💡 Dicas de Produtividade</h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Maximize seus Resultados:</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Use os botões rápidos "+ Cliente" e "$ Venda" no header</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Mantenha o histórico de contatos sempre atualizado</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Defina metas realistas e acompanhe diariamente</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Use filtros e busca para encontrar informações rapidamente</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Revise suas comissões semanalmente</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-3">✅</span>
                  <p>Faça backup do banco de dados regularmente</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">🆘 Solução de Problemas</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-red-600 mb-2">❌ Sistema não inicia</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Verifique se a porta 3000 está livre</li>
                  <li>• Feche outros programas que usem a porta</li>
                  <li>• Reinicie o computador se necessário</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-orange-600 mb-2">⚠️ Janela preta fechou</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Execute o ícone novamente</li>
                  <li>• Aguarde a inicialização completa</li>
                  <li>• NÃO feche a janela preta (console)</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-yellow-600 mb-2">💾 Erro ao salvar dados</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Verifique campos obrigatórios (*)</li>
                  <li>• Confirme se há mensagens de erro</li>
                  <li>• Tente novamente após alguns segundos</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-blue-600 mb-2">🔍 Não encontro dados</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Use termos diferentes na busca</li>
                  <li>• Verifique os filtros aplicados</li>
                  <li>• Atualize a página (F5)</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>📞 Suporte:</strong> Se o problema persistir, entre em contato com o suporte técnico.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/', icon: '🏠' },
            { label: 'Manual do Usuário', icon: '📖' }
          ]}
        />

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">📖 Manual do Usuário</h1>
            <p className="text-blue-100 text-lg">Guia completo para usar o Representatives App v1.0.2</p>
          </div>
          
          <div className="flex">
            {/* Sidebar Menu */}
            <div className="w-64 bg-gray-50 p-4 border-r border-gray-200">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}