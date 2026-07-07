export const queryKeys = {
  // Auth
  auth: () => ['auth'],
  session: () => ['auth', 'session'],

  // Merchants
  merchants: () => ['merchants'],
  getMerchantProfile: () => ['merchants', 'profile'],
  getMerchantStats: () => ['merchants', 'stats'],

  // Transactions
  transactions: () => ['transactions'],
  listTransactions: (params?: Record<string, unknown>) => [
    'transactions',
    { ...params },
  ],
  getTransactions: (params?: Record<string, unknown>) => [
    'transactions',
    { ...params },
  ],
  getTransactionById: (id: string) => ['transactions', id],
  getTransaction: (id: string) => ['transactions', id],

  // Withdrawals
  withdrawals: () => ['withdrawals'],
  listWithdrawals: () => ['withdrawals', 'list'],
  getWithdrawals: () => ['withdrawals', 'list'],
  getWithdrawalBalance: () => ['withdrawals', 'balance'],
  getBankAccount: () => ['withdrawals', 'bank-account'],
}
