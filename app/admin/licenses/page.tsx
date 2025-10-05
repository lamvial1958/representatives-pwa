'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface License {
  id: string
  licenseKey: string
  type: string
  status: string
  issuedTo: string
  companyName: string | null
  expiryDate: string | null
  isLifetime: boolean
  maxUsers: number
  features: string[]
  createdAt: string
  activeDevices: number
  totalDevices: number
}

interface CreateLicenseForm {
  type: 'trial' | 'standard' | 'premium' | 'enterprise' | 'gift'
  issuedTo: string
  companyName: string
  maxUsers: number
  expiryDate: string
  features: 'all' | string[]
}

export default function AdminLicensesPage() {
  const router = useRouter()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLicense, setNewLicense] = useState<CreateLicenseForm>({
    type: 'enterprise',
    issuedTo: '',
    companyName: '',
    maxUsers: 1,
    expiryDate: 'lifetime',
    features: 'all'
  })
  const [createdLicenseKey, setCreatedLicenseKey] = useState<string | null>(null)

  // Verificar autenticação
  useEffect(() => {
    checkAuth()
  }, [])

  // Carregar licenças
  useEffect(() => {
    if (!loading) {
      loadLicenses()
    }
  }, [statusFilter, typeFilter, searchQuery])

  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/auth/check')
      const data = await response.json()
      
      if (!data.authenticated) {
        router.push('/admin/login')
        return
      }
      
      setLoading(false)
      loadLicenses()
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err)
      router.push('/admin/login')
    }
  }

  async function loadLicenses() {
    try {
      setError(null)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      
      const url = `/api/admin/licenses${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setLicenses(data.data)
      } else {
        setError(data.error || 'Erro ao carregar licenças')
      }
    } catch (err) {
      console.error('Erro ao carregar licenças:', err)
      setError('Erro ao conectar com o servidor')
    }
  }

  async function handleCreateLicense() {
    setCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCreatedLicenseKey(data.data.licenseKey)
        loadLicenses()
        // Não fechar modal ainda - mostrar chave criada
      } else {
        setError(data.error || 'Erro ao criar licença')
      }
    } catch (err) {
      console.error('Erro ao criar licença:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevokeLicense(id: string, key: string) {
    if (!confirm(`Tem certeza que deseja revogar a licença ${key}?\n\nTodos os dispositivos ativos serão bloqueados.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Licença ${key} revogada com sucesso.\n${data.data.devicesBlocked} dispositivo(s) bloqueado(s).`)
        loadLicenses()
      } else {
        alert(data.error || 'Erro ao revogar licença')
      }
    } catch (err) {
      console.error('Erro ao revogar licença:', err)
      alert('Erro ao conectar com o servidor')
    }
  }

  function resetModal() {
    setShowCreateModal(false)
    setCreatedLicenseKey(null)
    setNewLicense({
      type: 'enterprise',
      issuedTo: '',
      companyName: '',
      maxUsers: 1,
      expiryDate: 'lifetime',
      features: 'all'
    })
    setError(null)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    alert('Chave copiada para a área de transferência!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Licenças</h1>
              <p className="mt-1 text-sm text-gray-500">Painel administrativo para criação e gestão de licenças</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                + Gerar Nova Licença
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chave, nome ou empresa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="active">Ativa</option>
                <option value="expired">Expirada</option>
                <option value="revoked">Revogada</option>
                <option value="suspended">Suspensa</option>
              </select>
            </div>

            {/* Filtro Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="trial">Trial</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
                <option value="gift">GIFT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emitida Para
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiração
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispositivos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma licença encontrada
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-900">{license.licenseKey}</span>
                        <button
                          onClick={() => copyToClipboard(license.licenseKey)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Copiar chave"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        license.type === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        license.type === 'premium' ? 'bg-blue-100 text-blue-800' :
                        license.type === 'standard' ? 'bg-green-100 text-green-800' :
                        license.type === 'gift' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {license.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        license.status === 'active' ? 'bg-green-100 text-green-800' :
                        license.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                        license.status === 'revoked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {license.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{license.issuedTo}</div>
                      {license.companyName && (
                        <div className="text-xs text-gray-500">{license.companyName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.isLifetime ? '∞ Vitalícia' : new Date(license.expiryDate!).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-green-600 font-medium">{license.activeDevices}</span>
                      <span className="text-gray-500"> / {license.totalDevices}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {license.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevokeLicense(license.id, license.licenseKey)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total de Licenças</div>
            <div className="text-2xl font-bold text-gray-900">{licenses.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Ativas</div>
            <div className="text-2xl font-bold text-green-600">
              {licenses.filter(l => l.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Revogadas</div>
            <div className="text-2xl font-bold text-red-600">
              {licenses.filter(l => l.status === 'revoked').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Dispositivos Ativos</div>
            <div className="text-2xl font-bold text-blue-600">
              {licenses.reduce((sum, l) => sum + l.activeDevices, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar Licença */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {createdLicenseKey ? 'Licença Criada com Sucesso!' : 'Gerar Nova Licença'}
              </h2>

              {createdLicenseKey ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="text-sm text-gray-700 mb-2">Chave Gerada:</div>
                    <div className="flex items-center gap-2">
                      <code className="text-2xl font-mono font-bold text-green-700">{createdLicenseKey}</code>
                      <button
                        onClick={() => copyToClipboard(createdLicenseKey)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-900">
                      <strong>Próximos passos:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Copie a chave acima</li>
                        <li>Envie para o usuário</li>
                        <li>Usuário acessa /license e ativa a chave</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={resetModal}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Licença *
                    </label>
                    <select
                      value={newLicense.type}
                      onChange={(e) => {
                        const type = e.target.value as any
                        setNewLicense({
                          ...newLicense,
                          type,
                          maxUsers: type === 'enterprise' ? 999 :
                                    type === 'premium' ? 10 :
                                    type === 'standard' ? 5 : 1,
                          expiryDate: type === 'trial' ? '90' :
                                     type === 'gift' ? 'lifetime' :
                                     type === 'enterprise' ? 'lifetime' : '365'
                        })
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="trial">Trial (90 dias)</option>
                      <option value="standard">Standard (1 ano, 5 usuários)</option>
                      <option value="premium">Premium (1 ano, 10 usuários)</option>
                      <option value="enterprise">Enterprise (Vitalícia, ilimitado)</option>
                      <option value="gift">GIFT (Doação vitalícia, 1 usuário)</option>
                    </select>
                  </div>

                  {/* Emitida Para */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emitida Para *
                    </label>
                    <input
                      type="text"
                      value={newLicense.issuedTo}
                      onChange={(e) => setNewLicense({ ...newLicense, issuedTo: e.target.value })}
                      placeholder="Nome da pessoa ou organização"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Empresa (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      value={newLicense.companyName}
                      onChange={(e) => setNewLicense({ ...newLicense, companyName: e.target.value })}
                      placeholder="Nome da empresa"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Max Users */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usuários Máximos
                    </label>
                    <input
                      type="number"
                      value={newLicense.maxUsers}
                      onChange={(e) => setNewLicense({ ...newLicense, maxUsers: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Expiração */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiração
                    </label>
                    <select
                      value={newLicense.expiryDate}
                      onChange={(e) => setNewLicense({ ...newLicense, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lifetime">Vitalícia</option>
                      <option value="90">90 dias</option>
                      <option value="365">1 ano</option>
                    </select>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleCreateLicense}
                      disabled={creating || !newLicense.issuedTo.trim()}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Gerando...' : 'Gerar Licença'}
                    </button>
                    <button
                      onClick={resetModal}
                      disabled={creating}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}