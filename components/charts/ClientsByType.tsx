'use client';

import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ClientsByTypeProps {
  individual: number;
  business: number;
}

export default function ClientsByType({ individual, business }: ClientsByTypeProps) {
  const { t } = useTranslation();
  
  // Validation - Ensure numbers are valid
  const safeIndividual = typeof individual === 'number' && individual >= 0 ? individual : 0;
  const safeBusiness = typeof business === 'number' && business >= 0 ? business : 0;
  const total = safeIndividual + safeBusiness;
  
  const data = (process.env.NEXT_PUBLIC_DEMO === "true") ? [
    { 
      name: `👤 ${t('dashboard.charts.individual', 'Individual')}`, 
      value: safeIndividual, 
      percentage: total > 0 ? Math.round((safeIndividual / total) * 100) : 0 
    },
    { 
      name: `🏢 ${t('dashboard.charts.business', 'Business')}`, 
      value: safeBusiness, 
      percentage: total > 0 ? Math.round((safeBusiness / total) * 100) : 0 
    }
  ] : [];

  const COLORS = {
    individual: '#8b5cf6', // Purple
    business: '#f59e0b'     // Orange
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-semibold mb-1">{data.name}</div>
          <div className="text-sm text-gray-600">
            {data.value} {t('dashboard.charts.client', 'client')}{data.value !== 1 ? 's' : ''} ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderLabel = (entry: any) => {
    if (!entry || entry.value === 0) return '';
    return `${entry.percentage}%`;
  };

  if (total === 0) {
    return (
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>{t('dashboard.charts.noClients', 'No clients to display')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? COLORS.individual : COLORS.business} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Fixed Legend with proper spacing */}
      <div className="flex justify-center mt-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: COLORS.individual }}
            ></div>
            <span>👤 {t('dashboard.charts.individual', 'Individual')} ({safeIndividual})</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: COLORS.business }}
            ></div>
            <span>🏢 {t('dashboard.charts.business', 'Business')} ({safeBusiness})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

