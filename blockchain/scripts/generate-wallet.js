import hre from 'hardhat';
const { ethers } = hre;

async function main() {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log('\n🔐 New Deployment Wallet Generated\n');
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  console.log('Mnemonic:', wallet.mnemonic.phrase);
  console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
  console.log('⚠️  Never commit private keys to version control!');
  console.log('\n📝 Next Steps:');
  console.log('1. Add DEPLOYER_PRIVATE_KEY to your .env file');
  console.log('2. Get testnet ETH from Base Sepolia faucet:');
  console.log('   https://www.alchemy.com/faucets/base-sepolia');
  console.log('3. Run: npx hardhat run scripts/deploy.js --network baseSepolia\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
