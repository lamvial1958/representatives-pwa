'use client';

import { useTranslation } from 'react-i18next';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClientsGrowthProps {
  data: { month: string; count: number }[];
}

export default function ClientsGrowth({ data }: ClientsGrowthProps) {
  const { t } = useTranslation();

  // Validation - Return early if no valid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p>{t('dashboard.charts.noGrowthData', 'No growth data available')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure data integrity
  const validData = data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.month === 'string' && 
    typeof item.count === 'number' &&
    item.month.length > 0 &&
    item.count >= 0
  );

  if (validData.length === 0) {
    return (
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p>{t('dashboard.charts.invalidData', 'Invalid data format')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Process data to show cumulative growth
  const processedData = validData.reduce((acc, current, index) => {
    const cumulative = acc.length > 0 
      ? acc[acc.length - 1].cumulative + current.count 
      : current.count;
    
    acc.push({
      month: current.month,
      current: current.count,
      cumulative: cumulative
    });
    
    return acc;
  }, [] as { month: string; current: number; cumulative: number }[]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-semibold mb-2">{label} 2025</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-blue-600">{t('dashboard.charts.newClients', 'New clients')}:</span>
              <span className="font-medium">{payload[1]?.value || 0}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-green-600">{t('dashboard.charts.totalClients', 'Total clients')}:</span>
              <span className="font-medium">{payload[0]?.value || 0}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart
          data={processedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
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
          
          {/* Area for cumulative growth */}
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorCumulative)"
          />
          
          {/* Line for monthly new clients */}
          <Line
            type="monotone"
            dataKey="current"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Fixed Legend with proper spacing */}
      <div className="flex justify-center mt-4 pt-2 border-t border-gray-100 text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>{t('dashboard.charts.newClientsPerMonth', 'New Clients per Month')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{t('dashboard.charts.cumulativeGrowth', 'Cumulative Growth')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
