import Image from 'next/image'
import { Client } from '../api/clientsApi'

interface ClientListItemProps {
  client: Client
  onEdit: () => void
}

export default function ClientListItem({ client, onEdit }: ClientListItemProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12">
            <Image
              src={client.avatar}
              alt={client.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium">{client.name}</h3>
            <span className="text-sm text-gray-500">Last active: {client.lastActive}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-500">Training Progress</div>
            <div className="font-medium">{client.completionPercentage}%</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {client.status}
            </span>
            <button 
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 