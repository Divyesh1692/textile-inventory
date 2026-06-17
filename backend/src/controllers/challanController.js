const Challan = require("../models/Challan");
const Stock = require("../models/Stock");

exports.createBulkChallan = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided for bulk challan." });
    }

    const newChallans = [];

    for (const item of items) {
      const stock = await Stock.findById(item.stockId);
      if (!stock) {
        return res.status(404).json({ message: `Stock not found for ID: ${item.stockId}` });
      }
      if (stock.status === "Delivered") {
        return res.status(400).json({
          message: `Stock is already delivered for stock ID: ${item.stockId}`,
        });
      }
      stock.status = "Delivered";
      stock.deliveryChallanNo = item.challanNumber;
      stock.deliveryDate = item.deliveryDate || Date.now();
      await stock.save();

      const newChallan = new Challan({
        challanNumber: item.challanNumber,
        partyId: item.partyId,
        firmId: item.firmId,
        items: [{
          stockId: item.stockId,
          designId: item.designId,
          qty: item.qty,
          rate: item.rate
        }],
        totalQty: item.qty,
        totalAmount: item.qty * item.rate,
        deliveryDate: item.deliveryDate,
        status: "Delivered",
      });

      newChallans.push(newChallan);
    }

    const savedChallans = await Challan.insertMany(newChallans);
    res.status(201).json(savedChallans);
  } catch (error) {
    console.error("Error creating bulk challan:", error);
    res.status(500).json({ message: "Server error creating bulk challan", error: error.message });
  }
};

exports.createChallan = async (req, res) => {
  try {
    const { challanNumber, partyId, firmId, items, deliveryDate } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "No items provided for the challan." });
    }

    let totalQty = 0;
    let totalAmount = 0;

    for (const item of items) {
      const stock = await Stock.findById(item.stockId);
      if (!stock) {
        return res
          .status(404)
          .json({ message: `Stock not found for ID: ${item.stockId}` });
      }
      if (stock.status === "Delivered") {
        return res.status(400).json({
          message: `Stock is already marked as delivered for stock ID: ${item.stockId}`,
        });
      }
      stock.status = "Delivered";
      stock.deliveryChallanNo = challanNumber;
      stock.deliveryDate = deliveryDate || Date.now();
      await stock.save();
      totalQty += item.qty;
      totalAmount += item.qty * item.rate;
    }

    const newChallan = new Challan({
      challanNumber,
      partyId,
      firmId,
      items,
      totalQty,
      totalAmount,
      deliveryDate,
      status: "Delivered",

    });

    const savedChallan = await newChallan.save();
    res.status(201).json(savedChallan);
  } catch (error) {
    console.error("Error creating challan:", error);
    res
      .status(500)
      .json({ message: "Server error creating challan", error: error.message });
  }
};

exports.updateChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const { partyId, firmId, deliveryDate, items } = req.body;

    const challan = await Challan.findOne({ _id: id });
    if (!challan) return res.status(404).json({ message: "Challan not found" });

    if (challan.status === "Billed") {
      return res.status(400).json({ message: "Cannot edit a billed challan." });
    }

    // Restore old stock quantities first
    for (const oldItem of challan.items) {
      await Stock.findByIdAndUpdate(oldItem.stockId, {
        status: "Pending",
        $unset: { deliveryChallanNo: "", deliveryDate: "" },
      });
    }

    let totalQty = 0;
    let totalAmount = 0;

    // Deduct new stock quantities
    for (const item of items) {
      const stock = await Stock.findById(item.stockId);
      if (!stock) {
        return res
          .status(404)
          .json({ message: `Stock not found for ID: ${item.stockId}` });
      }
      if (stock.status === "Delivered") {
        return res.status(400).json({
          message: `Stock is already delivered for stock ID: ${item.stockId}`,
        });
      }
      stock.status = "Delivered";
      stock.deliveryChallanNo = challan.challanNumber;
      stock.deliveryDate = deliveryDate || challan.deliveryDate;
      await stock.save();
      totalQty += item.qty;
      totalAmount += item.qty * item.rate;
    }

    challan.partyId = partyId;
    challan.firmId = firmId;
    challan.deliveryDate = deliveryDate;
    challan.items = items;
    challan.totalQty = totalQty;
    challan.totalAmount = totalAmount;

    const updatedChallan = await challan.save();
    res.status(200).json(updatedChallan);
  } catch (error) {
    console.error("Error updating challan:", error);
    res
      .status(500)
      .json({ message: "Server error updating challan", error: error.message });
  }
};

exports.markChallanPrinted = async (req, res) => {
  try {
    const { id } = req.params;
    const challan = await Challan.findOne({ _id: id });
    if (!challan) return res.status(404).json({ message: "Challan not found" });

    // Only mark as Printed if not already Billed
    if (challan.status !== "Billed") {
      challan.status = "Printed";
      await challan.save();
    }
    res.status(200).json(challan);
  } catch (error) {
    res.status(500).json({
      message: "Server error marking challan printed",
      error: error.message,
    });
  }
};

exports.getNextChallanNumber = async (req, res) => {
  try {
    const lastChallan = await Challan.findOne({}).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastChallan && lastChallan.challanNumber) {
      const match = lastChallan.challanNumber.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const nextChallanStr = nextNum.toString();
    res.status(200).json({ nextChallanNumber: nextChallanStr });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching next number",
      error: error.message,
    });
  }
};

exports.getChallans = async (req, res) => {
  try {
    const challans = await Challan.find({})
      .populate("partyId", "name")
      .populate("firmId", "name")
      .populate("items.designId", "name rate photos")
      .populate("items.stockId", "challanNo chartNo date")
      .sort({ createdAt: -1 });
    res.status(200).json(challans);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching challans",
      error: error.message,
    });
  }
};

exports.getChallanById = async (req, res) => {
  try {
    const challan = await Challan.findOne({ _id: req.params.id })
      .populate("partyId", "name")
      .populate("firmId", "name")
      .populate("items.designId", "name rate photos")
      .populate("items.stockId", "challanNo chartNo date");
    if (!challan) return res.status(404).json({ message: "Challan not found" });
    res.status(200).json(challan);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching challan", error: error.message });
  }
};

exports.deleteChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const challan = await Challan.findById(id);
    if (!challan) return res.status(404).json({ message: "Challan not found" });

    if (challan.status === "Billed") {
      return res.status(400).json({ message: "Cannot delete a billed challan." });
    }

    // Restore old stock quantities first
    for (const item of challan.items) {
      await Stock.findByIdAndUpdate(item.stockId, {
        status: "Pending",
        $unset: { deliveryChallanNo: "", deliveryDate: "" },
      });
    }

    await Challan.findByIdAndDelete(id);
    res.status(200).json({ message: "Challan deleted successfully" });
  } catch (error) {
    console.error("Error deleting challan:", error);
    res.status(500).json({ message: "Server error deleting challan", error: error.message });
  }
};
