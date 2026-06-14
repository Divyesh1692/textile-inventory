require("dotenv").config();
const mongoose = require("mongoose");
const Company = require("./src/models/Company");
const User = require("./src/models/User");
const Design = require("./src/models/Design");
const Firm = require("./src/models/Firm");
const Party = require("./src/models/Party");
const Stock = require("./src/models/Stock");
const Challan = require("./src/models/Challan");
const Bill = require("./src/models/Bill");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for Migration");

    // 1. Create Default Company
    let defaultCompany = await Company.findOne({ name: "Default Company" });
    if (!defaultCompany) {
      defaultCompany = new Company({ name: "Default Company" });
      await defaultCompany.save();
      console.log("Created 'Default Company'");
    }

    const companyId = defaultCompany._id;

    // 2. Patch Users
    const userRes = await User.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${userRes.modifiedCount} Users`);

    // 3. Patch Designs
    const designRes = await Design.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${designRes.modifiedCount} Designs`);

    // 4. Patch Firms
    const firmRes = await Firm.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${firmRes.modifiedCount} Firms`);

    // 5. Patch Parties
    const partyRes = await Party.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${partyRes.modifiedCount} Parties`);

    // 6. Patch Stocks
    const stockRes = await Stock.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${stockRes.modifiedCount} Stocks`);

    // 7. Patch Challans
    const challanRes = await Challan.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${challanRes.modifiedCount} Challans`);

    // 8. Patch Bills
    const billRes = await Bill.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId } }
    );
    console.log(`Updated ${billRes.modifiedCount} Bills`);

    console.log("Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
