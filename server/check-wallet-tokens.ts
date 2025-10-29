import { getAllTokenAccounts } from './solana';

const wallet = '924yATAEdnrYmncJMX2je7dpiEfVRqCSPmQ2NK3QfoXA';

async function main() {
  console.log('Scanning wallet:', wallet);
  console.log('');

  const accounts = await getAllTokenAccounts(wallet);
  console.log('Total token accounts:', accounts.length);
  console.log('');

  const nonZero = [];
  for (const account of accounts) {
    const parsed = account.account.data.parsed;
    const mint = parsed.info.mint;
    const uiAmount = parsed.info.tokenAmount.uiAmount;
    const rawAmount = parsed.info.tokenAmount.amount;
    
    if (uiAmount > 0) {
      nonZero.push({ mint, uiAmount, rawAmount });
      console.log('Token:', mint);
      console.log('  Balance:', uiAmount, 'tokens');
      console.log('  Raw:', rawAmount);
      console.log('');
    }
  }

  console.log('=== SUMMARY ===');
  console.log('Non-zero balances:', nonZero.length);
}

main();
