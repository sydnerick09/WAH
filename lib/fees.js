/**
 * GWENO CENTRAL FEE CONFIGURATION
 * Edit amounts here. Amounts are in KES unless the key explicitly says USD.
 * Account activation is intentionally excluded: it is always KES 50 total,
 * with only the shortfall charged after the user's existing balance is applied.
 */
export const FEES = Object.freeze({
  // Mobile withdrawal processing fees by withdrawal balance (KES).
  mobileWithdrawalKes: Object.freeze({
    mpesa: Object.freeze([{ maxBalance: 5000, fee: 750 }, { maxBalance: 20000, fee: 1000 }, { maxBalance: 30000, fee: 2800 }, { maxBalance: 40000, fee: 2200 }]),
    airtel: Object.freeze([{ maxBalance: 5000, fee: 620 }, { maxBalance: 20000, fee: 980 }, { maxBalance: 30000, fee: 2600 }, { maxBalance: 40000, fee: 3600 }]),
  }),
  // Set to 0 for free profile changes. Set to any positive KES amount to charge it.
  profileUpdateKes: 0,
  premiumSubscriptionKes: 599,
  trainingKes: 132,
  referralRewardKes: 70,
  bankWithdrawalUsdToKesFallbackRate: 135,
  bankWithdrawalUsd: Object.freeze({
    'CB Bank': 23, 'NCBA Bank': 27, 'Co-operative Bank of Kenya': 38,
    'Co-operative Bank': 48, 'Equity Bank': 52, 'Absa Bank Kenya': 29,
    'Standard Chartered Bank': 24, 'Stanbic Bank Kenya': 49, 'Postbank Kenya': 38,
    'Family Bank of Kenya': 39, 'DTB Bank': 29, 'KCB Bank': 36,
    'Stanbic Bank Uganda': 22, 'Centenary Bank': 11, 'Absa Bank Uganda': 40,
    'Bank of Uganda': 41, 'Bank of Khartoum': 42, 'Faisal Islamic Bank': 43,
    'Omdurman National Bank': 44, 'CRDB Bank': 45, 'NMB Bank': 46, 'NBC Bank': 47,
    'Banco do Brasil': 48, 'Itaú Unibanco': 49, 'Banco Bradesco': 50, Bradesco: 50,
    'Banco Santander': 51, Santander: 51, 'Banco de Bogotá': 52, Bancolombia: 53,
    BCI: 54, 'Banco de Chile': 55, 'JPMorgan Chase': 60, 'Bank of America': 62,
    'Wells Fargo': 64, Citibank: 66, 'U.S. Bank': 68, 'PNC Bank': 70,
    'Truist Bank': 72, 'Capital One': 74, 'Barclays Bank': 40.5, 'HSBC UK': 41.5,
    Lloyds: 42.5, NatWest: 43.5, 'Standard Chartered': 44.5, 'Deutsche Bank': 45.5,
    Commerzbank: 46.5, 'DZ Bank': 47.5, 'BNP Paribas': 48.5, 'Société Générale': 49.5,
    'Crédit Agricole': 50.5, BBVA: 52.5, CaixaBank: 53.5, UniCredit: 54.5,
    'Intesa Sanpaolo': 55.5, 'ING Bank': 56.5, Rabobank: 57.5, 'ABN AMRO': 58.5,
    UBS: 59.5, 'Credit Suisse': 60.5, 'Allied Irish Banks (AIB)': 61.5,
    'Bank of Ireland': 62.5, 'KBC Bank': 63.5, 'Millennium BCP': 64.5,
    Nordea: 65.5, SEB: 66.5, DNB: 67.5, 'PKO Bank Polski': 68.5,
    'Emirates NBD': 69.5, 'First Abu Dhabi Bank': 70.5, 'Al Rajhi Bank': 71.5,
    'Saudi National Bank': 72.5, 'National Bank of Egypt': 73.5,
    'HBL (Habib Bank)': 74.5, 'United Bank (UBL)': 75.5, 'RBC Royal Bank': 76.5,
    'TD Canada Trust': 77.5, Scotiabank: 78.5, 'Guaranty Trust Bank (GTBank)': 79.5,
    'Access Bank': 80.5, 'First Bank of Nigeria': 81, 'Zenith Bank': 81.5,
    'Standard Bank': 40.25, 'First National Bank (FNB)': 41.25, Absa: 42.25,
    Capitec: 43.25, Nedbank: 44.25, 'Ecobank Ghana': 45.25, 'GCB Bank': 46.25,
    'State Bank of India (SBI)': 47.25, 'HDFC Bank': 48.25, 'ICICI Bank': 49.25,
    'Axis Bank': 50.25, ICBC: 51.25, 'Bank of China': 52.25,
    'China Construction Bank': 53.25, 'MUFG Bank': 54.25,
    'Sumitomo Mitsui (SMBC)': 55.25, 'Commonwealth Bank': 56.25, ANZ: 57.25,
    Westpac: 58.25, NAB: 59.25, 'DBS Bank': 60.25, 'OCBC Bank': 61.25,
    'UOB': 62.25, 'National Commercial Bank (NCB)': 63.25,
    'Scotiabank Jamaica': 64.25, 'JN Bank': 65.25, 'BBVA México': 66.25,
    Banorte: 67.25, Citibanamex: 68.25, 'Mobile Banking': 69.25,
  }),
});
