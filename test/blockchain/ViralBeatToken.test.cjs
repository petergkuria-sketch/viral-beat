const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ViralBeatToken", function () {
  let vbtToken;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M VBT
  const MAX_SUPPLY = ethers.parseEther("100000000"); // 100M VBT

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const VBTToken = await ethers.getContractFactory("ViralBeatToken");
    vbtToken = await VBTToken.deploy();
    await vbtToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await vbtToken.name()).to.equal("Viral Beat Token");
      expect(await vbtToken.symbol()).to.equal("VBT");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await vbtToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set correct max supply", async function () {
      expect(await vbtToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should track total minted correctly", async function () {
      expect(await vbtToken.totalMinted()).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Migration Minting", function () {
    it("Should mint tokens for verified migration", async function () {
      const mintAmount = ethers.parseEther("1000");
      const migrationId = ethers.id("migration-123");

      await vbtToken.mintForMigration(user1.address, mintAmount, migrationId);

      expect(await vbtToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await vbtToken.migratedAmount(user1.address)).to.equal(mintAmount);
      expect(await vbtToken.isMigrationProcessed(migrationId)).to.be.true;
    });

    it("Should prevent double-minting for same migration ID", async function () {
      const mintAmount = ethers.parseEther("1000");
      const migrationId = ethers.id("migration-123");

      await vbtToken.mintForMigration(user1.address, mintAmount, migrationId);

      await expect(
        vbtToken.mintForMigration(user1.address, mintAmount, migrationId)
      ).to.be.revertedWith("Migration already processed");
    });

    it("Should prevent minting beyond max supply", async function () {
      const excessAmount = MAX_SUPPLY; // Would exceed when added to initial supply
      const migrationId = ethers.id("migration-excess");

      await expect(
        vbtToken.mintForMigration(user1.address, excessAmount, migrationId)
      ).to.be.revertedWith("Would exceed max supply");
    });

    it("Should only allow owner to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      const migrationId = ethers.id("migration-unauthorized");

      await expect(
        vbtToken.connect(user1).mintForMigration(user2.address, mintAmount, migrationId)
      ).to.be.reverted;
    });
  });

  describe("Token Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");

      await vbtToken.transfer(user1.address, transferAmount);
      expect(await vbtToken.balanceOf(user1.address)).to.equal(transferAmount);

      await vbtToken.connect(user1).transfer(user2.address, transferAmount);
      expect(await vbtToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await vbtToken.balanceOf(owner.address);

      await expect(
        vbtToken.connect(user1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;

      expect(await vbtToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("1000");

      await vbtToken.transfer(user1.address, burnAmount);
      await vbtToken.connect(user1).burn(burnAmount);

      expect(await vbtToken.balanceOf(user1.address)).to.equal(0);
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause token transfers", async function () {
      await vbtToken.pause("Emergency test");
      expect(await vbtToken.paused()).to.be.true;

      await expect(
        vbtToken.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;

      await vbtToken.unpause();
      expect(await vbtToken.paused()).to.be.false;

      await vbtToken.transfer(user1.address, ethers.parseEther("100"));
      expect(await vbtToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should only allow owner to pause/unpause", async function () {
      await expect(vbtToken.connect(user1).pause("Unauthorized")).to.be.reverted;
      await expect(vbtToken.connect(user1).unpause()).to.be.reverted;
    });
  });

  describe("Supply Tracking", function () {
    it("Should correctly calculate remaining supply", async function () {
      const remaining = await vbtToken.remainingSupply();
      expect(remaining).to.equal(MAX_SUPPLY - INITIAL_SUPPLY);
    });

    it("Should update remaining supply after minting", async function () {
      const mintAmount = ethers.parseEther("1000");
      const migrationId = ethers.id("migration-supply-test");

      await vbtToken.mintForMigration(user1.address, mintAmount, migrationId);

      const remaining = await vbtToken.remainingSupply();
      expect(remaining).to.equal(MAX_SUPPLY - INITIAL_SUPPLY - mintAmount);
    });
  });
});
