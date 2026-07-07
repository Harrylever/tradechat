import TanstackQueryProvider from './TanstackQueryProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <TanstackQueryProvider>{children}</TanstackQueryProvider>
}
