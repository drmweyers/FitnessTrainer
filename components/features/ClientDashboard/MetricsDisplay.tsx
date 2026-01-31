'use client'

import { useState } from 'react'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChevronDown } from 'lucide-react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface MetricsDisplayProps {
  metrics: {
    weight: Array<{ date: string, value: number }>
    bodyFat: Array<{ date: string, value: number }>
    muscleMass: Array<{ date: string, value: number }>
  }
  detailed?: boolean
}

export default function MetricsDisplay({ metrics, detailed = false }: MetricsDisplayProps) {
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'bodyFat' | 'muscleMass'>('weight')
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m')
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // Filter data based on time range
  const filterDataByTimeRange = (data: Array<{ date: string, value: number }>) => {
    const now = new Date()
    const monthsAgo = (months: number) => {
      const date = new Date(now)
      date.setMonth(date.getMonth() - months)
      return date
    }
    
    const cutoffDate = {
      '1m': monthsAgo(1),
      '3m': monthsAgo(3),
      '6m': monthsAgo(6),
      '1y': monthsAgo(12)
    }[timeRange]
    
    return data.filter(item => new Date(item.date) >= cutoffDate)
  }
  
  // Prepare chart data
  const chartData = {
    labels: filterDataByTimeRange(metrics[selectedMetric]).map(item => formatDate(item.date)),
    datasets: [
      {
        label: selectedMetric === 'weight' 
          ? 'Weight (lbs)' 
          : selectedMetric === 'bodyFat' 
            ? 'Body Fat %' 
            : 'Muscle Mass (lbs)',
        data: filterDataByTimeRange(metrics[selectedMetric]).map(item => item.value),
        borderColor: selectedMetric === 'weight' 
          ? 'rgb(59, 130, 246)' 
          : selectedMetric === 'bodyFat' 
            ? 'rgb(239, 68, 68)' 
            : 'rgb(16, 185, 129)',
        backgroundColor: selectedMetric === 'weight' 
          ? 'rgba(59, 130, 246, 0.1)' 
          : selectedMetric === 'bodyFat' 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }
  
  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    maintainAspectRatio: false
  }
  
  // Get current value and change
  const getCurrentMetricValue = () => {
    const data = metrics[selectedMetric]
    return data.length > 0 ? data[data.length - 1].value : 0
  }
  
  const getMetricChange = () => {
    const data = metrics[selectedMetric]
    if (data.length < 2) return 0
    
    const current = data[data.length - 1].value
    const previous = data[0].value
    return current - previous
  }
  
  const metricChange = getMetricChange()
  const isPositiveChange = selectedMetric === 'muscleMass' ? metricChange > 0 : metricChange < 0
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-800">Body Metrics</h2>
        
        <div className="flex space-x-2">
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
            >
              <option value="weight">Weight</option>
              <option value="bodyFat">Body Fat</option>
              <option value="muscleMass">Muscle Mass</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>
          
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="1m">1 Month</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Current {selectedMetric === 'weight' ? 'Weight' : selectedMetric === 'bodyFat' ? 'Body Fat' : 'Muscle Mass'}</div>
          <div className="text-xl font-semibold text-gray-800">
            {getCurrentMetricValue()}
            <span className="text-sm ml-1">
              {selectedMetric === 'weight' ? 'lbs' : selectedMetric === 'bodyFat' ? '%' : 'lbs'}
            </span>
          </div>
          <div className={`mt-1 text-xs flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            <span>{metricChange > 0 ? '+' : ''}{metricChange.toFixed(1)}</span>
            <span className="ml-1">since start</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Starting {selectedMetric === 'weight' ? 'Weight' : selectedMetric === 'bodyFat' ? 'Body Fat' : 'Muscle Mass'}</div>
          <div className="text-xl font-semibold text-gray-800">
            {metrics[selectedMetric][0]?.value || 0}
            <span className="text-sm ml-1">
              {selectedMetric === 'weight' ? 'lbs' : selectedMetric === 'bodyFat' ? '%' : 'lbs'}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {metrics[selectedMetric][0] ? formatDate(metrics[selectedMetric][0].date) : 'N/A'}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Goal {selectedMetric === 'weight' ? 'Weight' : selectedMetric === 'bodyFat' ? 'Body Fat' : 'Muscle Mass'}</div>
          <div className="text-xl font-semibold text-gray-800">
            {selectedMetric === 'weight' ? '150' : selectedMetric === 'bodyFat' ? '22' : '58'}
            <span className="text-sm ml-1">
              {selectedMetric === 'weight' ? 'lbs' : selectedMetric === 'bodyFat' ? '%' : 'lbs'}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Target date: Aug 15, 2023
          </div>
        </div>
      </div>
      
      <div className="h-64 md:h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {detailed && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Detailed History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Body Fat (%)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Muscle Mass (lbs)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.weight.map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatDate(metrics.weight[index].date)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metrics.weight[index].value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metrics.bodyFat[index].value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metrics.muscleMass[index].value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}