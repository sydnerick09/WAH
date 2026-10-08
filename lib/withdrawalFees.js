// Shared withdrawal processing-fee rules.
// Keep the schedule in one place so the UI and Daraja server validation cannot drift.

export const WITHDRAWAL_FEE_SCHEDULE = Object.freeze({
  mpesa: Object.freeze([
    { maxBalance: 5000, fee: 650 },
    { maxBalance: 20000, fee: 1000 },
    { maxBalance: 30000, fee: 2800 },
    { maxBalance: 40000, fee: 2200 },
  ]),
  airtel: Object.freeze([
    { maxBalance: 5000, fee: 620 },
    { maxBalance: 20000, fee: 980 },
    { maxBalance: 30000, fee: 2600 },
    { maxBalance: 40000, fee: 3600 },
  ]),
});

export function getWithdrawalFee(balance, method) {
  const amount = Number(balance || 0);
  const key = String(method || '').toLowerCase();
  if (!(amount >= 1)) return null;
  const schedule = WITHDRAWAL_FEE_SCHEDULE[key];
  if (!schedule || amount > 40000) return null;
  const bracket = schedule.find(({ maxBalance }) => amount <= maxBalance);
  return bracket ? bracket.fee : null;
}

export function isSupportedWithdrawalMethod(method) {
  return ['mpesa', 'airtel'].includes(String(method || '').toLowerCase());
} 