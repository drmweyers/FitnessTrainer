'use client'

import { RecoilRoot } from 'recoil'
import { AuthProvider } from '@/contexts/AuthContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RecoilRoot>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RecoilRoot>
  )
} 