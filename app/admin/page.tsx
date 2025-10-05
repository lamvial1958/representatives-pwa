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

interface LicensesByType {
  [key: string]: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      const authResponse = await fetch('/api/admin/auth/check')
      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        router.push('/admin/login')
        return
      }
      
      await loadLicenses()
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err)
      router.push('/admin/login')
    }
  }

  async function loadLicenses() {
    try {
      setError(null)
      
      const response = await fetch('/api/admin/licenses')
      const data = await response.json()
      
      if (data.success) {
        setLicenses(data.data)
      } else {
        setError(data.error || 'Erro ao carregar licenças')
      }
    } catch (err) {
      console.error('Erro ao carregar licenças:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
    devices: licenses.reduce((sum, l) => sum + l.activeDevices, 0)
  }

  // Agrupar licenças por tipo
  const licensesByType: LicensesByType = licenses.reduce((acc, license) => {
    acc[license.type] = (acc[license.type] || 0) + 1
    return acc
  }, {} as LicensesByType)

  // Últimas 5 licenças criadas
  const recentLicenses = [...licenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="mt-1 text-sm text-gray-500">Visão geral do sistema de licenciamento</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin/licenses')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Gerenciar Licenças
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Voltar ao Sistema
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Total de Licenças</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Ativas</div>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Expiradas</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.expired}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Revogadas</div>
            <div className="text-3xl font-bold text-red-600">{stats.revoked}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Dispositivos Ativos</div>
            <div className="text-3xl font-bold text-blue-600">{stats.devices}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Licenças por Tipo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Licenças por Tipo</h2>
            
            {Object.keys(licensesByType).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Nenhuma licença cadastrada
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(licensesByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const percentage = (count / stats.total) * 100
                    const color = 
                      type === 'enterprise' ? 'bg-purple-500' :
                      type === 'premium' ? 'bg-blue-500' :
                      type === 'standard' ? 'bg-green-500' :
                      type === 'gift' ? 'bg-pink-500' : 'bg-gray-500'
                    
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${color} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Status das Licenças */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Status das Licenças</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ativas</span>
                  <span className="text-sm text-gray-600">{stats.active} ({stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Expiradas</span>
                  <span className="text-sm text-gray-600">{stats.expired} ({stats.total > 0 ? ((stats.expired / stats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.expired / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Revogadas</span>
                  <span className="text-sm text-gray-600">{stats.revoked} ({stats.total > 0 ? ((stats.revoked / stats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.revoked / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Licenças Criadas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Últimas Licenças Criadas</h2>
          </div>
          
          {recentLicenses.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Nenhuma licença cadastrada
            </div>
          ) : (
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
                    Emitida Para
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criada em
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{license.licenseKey}</span>
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{license.issuedTo}</div>
                      {license.companyName && (
                        <div className="text-xs text-gray-500">{license.companyName}</div>
                      )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(license.createdAt).toLocaleDateString('pt-BR')} {new Date(license.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}