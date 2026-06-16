/**
 * Automated Contract Verification Script for BaseScan
 * 
 * This script verifies the VBToken smart contract on BaseScan after deployment.
 * It uses the Hardhat verification API to submit the contract source code.
 * 
 * Usage:
 *   node scripts/verify.js <contract-address>
 * 
 * Example:
 *   node scripts/verify.js 0x1234567890123456789012345678901234567890
 */

const hre = require("hardhat");

async function main() {
  // Get contract address from command line arguments
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.error("❌ Error: Contract address is required");
    console.log("Usage: node scripts/verify.js <contract-address>");
    process.exit(1);
  }

  console.log("🔍 Starting contract verification on BaseScan...");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log("");

  try {
    // Verify the contract on BaseScan
    // Constructor arguments should match the deployment script
    const constructorArguments = []; // VBToken has no constructor arguments

    console.log("⏳ Submitting contract source code to BaseScan...");
    console.log("   This may take a few minutes...");
    console.log("");

    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });

    console.log("");
    console.log("✅ Contract verified successfully!");
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/address/${contractAddress}#code`);
    console.log("");
    console.log("📝 Next Steps:");
    console.log("   1. Update VBT_CONTRACT_ADDRESS environment variable");
    console.log("   2. Restart the migration service");
    console.log("   3. Test the migration flow");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified on BaseScan");
      console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/address/${contractAddress}#code`);
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("");
      console.log("💡 Troubleshooting:");
      console.log("   - Ensure the contract is deployed and confirmed on-chain");
      console.log("   - Check that BASESCAN_API_KEY is set in .env");
      console.log("   - Verify the contract address is correct");
      console.log("   - Wait a few minutes after deployment before verifying");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
