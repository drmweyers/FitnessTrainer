import { Metadata } from 'next'
import ClientsGuard from './ClientsGuard'

export const metadata: Metadata = {
  title: 'Client Management Dashboard',
  description: 'Manage your clients and track their training progress',
}

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientsGuard>{children}</ClientsGuard>
}
