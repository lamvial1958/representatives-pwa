'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import CustomerForm from '@/components/forms/CustomerForm';

export default function NewClientPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSuccess = () => {
    // Redirecionar para lista após sucesso
    router.push('/clients');
  };

  const handleCancel = () => {
    // Voltar para lista
    router.push('/clients');
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
          { label: t('nav.clients', 'Clientes'), href: '/clients', icon: '👥' },
          { label: t('clients.newClient', 'Novo Cliente'), icon: '➕' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ➕ {t('clients.form.title', 'Novo Cliente')}
          </h1>
          <p className="text-gray-600">
            {t('clients.form.subtitle', 'Preencha as informações abaixo para cadastrar um novo cliente')}
          </p>
        </div>
        
        <Link
          href="/clients"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          👈 {t('common.backToList', 'Voltar à Lista')}
        </Link>
      </div>

      {/* ✅ CustomerForm SEM onSubmit customizado - usa API própria */}
      <CustomerForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        title="➕ Novo Cliente com CRM"
      />
    </div>
  );
}
