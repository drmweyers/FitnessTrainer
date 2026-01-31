'use client'

interface PublishingTabsProps {
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  counts: {
    all: number
    published: number
    draft: number
    archived: number
  }
}

export default function PublishingTabs({ 
  selectedStatus, 
  setSelectedStatus, 
  counts 
}: PublishingTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedStatus === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedStatus('all')}
          >
            All
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-700">
              {counts.all}
            </span>
          </button>
          
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedStatus === 'published'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedStatus('published')}
          >
            Published
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-700">
              {counts.published}
            </span>
          </button>
          
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedStatus === 'draft'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedStatus('draft')}
          >
            Drafts
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-700">
              {counts.draft}
            </span>
          </button>
          
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedStatus === 'archived'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedStatus('archived')}
          >
            Archived
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-700">
              {counts.archived}
            </span>
          </button>
        </nav>
      </div>
    </div>
  )
}