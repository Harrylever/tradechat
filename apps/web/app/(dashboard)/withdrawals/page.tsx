import { getToken, getMerchantId } from "@/lib/auth"
import {
  getWithdrawalBalance,
  listWithdrawals,
  getBankAccount,
} from "@/lib/api"
import { WithdrawalsClient } from "./WithdrawalsClient"

export const metadata = { title: "Withdrawals — Tradechat" }

export default async function WithdrawalsPage() {
  const token = (await getToken())!

  const [balanceData, withdrawals, bankAccount] = await Promise.all([
    getWithdrawalBalance(token),
    listWithdrawals(token),
    getBankAccount(token).catch(() => null), // 404 → null if not set
  ])

  return (
    <WithdrawalsClient
      token={token}
      balance={balanceData.availableNaira}
      withdrawals={withdrawals}
      bankAccount={bankAccount}
    />
  )
}
