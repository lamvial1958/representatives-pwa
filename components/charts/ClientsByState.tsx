'use client';

import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ClientsByStateProps {
  data: { state: string; count: number }[];
}

export default function ClientsByState({ data }: ClientsByStateProps) {
  const { t } = useTranslation();

  // RS sempre com cor especial (verde)
  const getBarColor = (state: string) => {
    return state === 'RS' ? '#16a34a' : '#3b82f6'; // Verde para RS, azul para outros
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isRS = label === 'RS';
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            {isRS && <span>🏴󠁢󠁲󠁲󠁳󠁿</span>}
            <span className="font-semibold">
              {isRS ? 'Rio Grande do Sul' : label}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {payload[0].value} {t('dashboard.charts.client', 'client')}{payload[0].value !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }
    return null;
  };

  // Validation - Return early if no valid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>{t('dashboard.charts.noData', 'No data available')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure data integrity
  const validData = data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.state === 'string' && 
    typeof item.count === 'number' &&
    item.state.length > 0 &&
    item.count >= 0
  );

  if (validData.length === 0) {
    return (
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>{t('dashboard.charts.invalidData', 'Invalid data format')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={validData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="state" 
            stroke="#666"
            fontSize={12}
            tick={{ fill: '#666' }}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tick={{ fill: '#666' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.state)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Fixed Legend with proper spacing */}
      <div className="flex justify-center mt-4 pt-2 border-t border-gray-100 text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>🏴󠁢󠁲󠁲󠁳󠁿 Rio Grande do Sul</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>{t('dashboard.charts.otherStates', 'Other States')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
