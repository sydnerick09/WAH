// Shared withdrawal processing-fee rules. Edit this schedule or the central
// lib/fees.js configuration to manage fees without hunting through UI files.
import { FEES } from './fees';
export const WITHDRAWAL_FEE_SCHEDULE = FEES.mobileWithdrawalKes;
export function getWithdrawalFee(balance, method) {
  const amount = Number(balance || 0);
  const schedule = WITHDRAWAL_FEE_SCHEDULE[String(method || '').toLowerCase()];
  if (!(amount >= 1) || !schedule || amount > 40000) return null;
  const bracket = schedule.find(({ maxBalance }) => amount <= maxBalance);
  return bracket ? bracket.fee : null;
}
export function isSupportedWithdrawalMethod(method) {
  return ['mpesa', 'airtel'].includes(String(method || '').toLowerCase());
}
