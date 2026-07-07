import { TransactionsClient } from '@/components/transactions/TransactionsClient'
import { listTransactions } from '@/services/transaction.service'

export const metadata = {
  title: 'Transactions',
  description:
    'Monitor customer payment requests, checkout links, and settlement statuses',
}

export default async function TransactionsPage() {
  const transactions = await listTransactions({ limit: 500 })

  return <TransactionsClient transactions={transactions} />
}
