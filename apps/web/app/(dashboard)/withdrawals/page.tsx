import { WithdrawalsClient } from './WithdrawalsClient'

import {
  getBankAccount,
  getWithdrawalBalance,
  listWithdrawals,
} from '@/services/withdrawal.service'

export const metadata = { title: 'Withdrawals' }

export default async function WithdrawalsPage() {
  const [balanceData, withdrawals, bankAccount] = await Promise.all([
    getWithdrawalBalance(),
    listWithdrawals(),
    getBankAccount().catch(() => null), // 404 → null if not set
  ])

  return (
    <WithdrawalsClient
      balance={balanceData.availableNaira}
      withdrawals={withdrawals}
      bankAccount={bankAccount}
    />
  )
}
