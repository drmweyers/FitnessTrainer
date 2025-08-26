'use client'

import { 
  Filter, 
  Bell, 
  Settings, 
  ChevronDown,
  Menu,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              priority
            />
            <span className="font-semibold text-lg hidden sm:inline">FitTrack Pro</span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings size={20} />
          </button>
          <div className="flex items-center gap-3 ml-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-gray-500">Recipe Creator</div>
            </div>
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <Image
                src="https://picsum.photos/id/1005/40/40"
                alt="Profile"
                width={32}
                height={32}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}