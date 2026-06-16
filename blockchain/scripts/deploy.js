const hre = require("hardhat");

async function main() {
  console.log("Deploying VBToken to Base Sepolia testnet...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const VBToken = await hre.ethers.getContractFactory("VBToken");
  const vbToken = await VBToken.deploy();

  await vbToken.waitForDeployment();

  const contractAddress = await vbToken.getAddress();
  console.log("VBToken deployed to:", contractAddress);

  // Get deployment details
  const name = await vbToken.name();
  const symbol = await vbToken.symbol();
  const totalSupply = await vbToken.totalSupply();
  const maxSupply = await vbToken.MAX_SUPPLY();

  console.log("\nContract Details:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "VBT");
  console.log("Max Supply:", hre.ethers.formatEther(maxSupply), "VBT");
  console.log("Owner:", deployer.address);

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify contract on BaseScan:");
  console.log(`   npx hardhat verify --network baseSepolia ${contractAddress}`);
  console.log("2. Save contract address to .env:");
  console.log(`   VBT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("3. Update frontend with contract address and ABI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
