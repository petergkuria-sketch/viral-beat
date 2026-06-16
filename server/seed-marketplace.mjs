import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const marketplaceItems = [
  {
    name: "Premium Analytics",
    description: "Unlock advanced trend insights, competitor analysis, and predictive analytics for 30 days",
    cost: 100,
    category: "analytics",
    duration: 30,
  },
  {
    name: "Content Boost",
    description: "Increase your content visibility in the community feed for 7 days",
    cost: 50,
    category: "boost",
    duration: 7,
  },
  {
    name: "Contributor Badge",
    description: "Show off your contributor status with an exclusive profile badge (permanent)",
    cost: 75,
    category: "badge",
    duration: null,
  },
  {
    name: "AI Agent Discount Pass",
    description: "Get 20% off all AI agent usage for 7 days",
    cost: 150,
    category: "discount",
    duration: 7,
  },
  {
    name: "Priority Support",
    description: "Get faster help from our team with priority ticket handling for 30 days",
    cost: 200,
    category: "support",
    duration: 30,
  },
  {
    name: "Creator Spotlight",
    description: "Feature your profile on the homepage for 3 days",
    cost: 120,
    category: "boost",
    duration: 3,
  },
];

async function seedMarketplace() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log("Seeding marketplace items...");
    
    for (const item of marketplaceItems) {
      const [existing] = await connection.execute(
        "SELECT id FROM marketplaceItems WHERE name = ?",
        [item.name]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          "INSERT INTO marketplaceItems (name, description, cost, category, duration, isActive) VALUES (?, ?, ?, ?, ?, true)",
          [item.name, item.description, item.cost, item.category, item.duration]
        );
        console.log(`✓ Added: ${item.name} (${item.cost} VBT)`);
      } else {
        console.log(`- Skipped: ${item.name} (already exists)`);
      }
    }
    
    console.log("\nMarketplace seeding complete!");
  } catch (error) {
    console.error("Error seeding marketplace:", error);
  } finally {
    await connection.end();
  }
}

seedMarketplace();
