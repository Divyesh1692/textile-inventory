const Stock = require("../models/Stock");
const Design = require("../models/Design");

exports.createStock = async (req, res) => {
  try {
    const {
      date,
      challanNo,
      designId,
      chartNo,
      partyId,
      firmId,
      qty,
      rate,
      Amount,
      status,
    } = req.body;

    const design = await Design.findById(designId);
    const costing = design ? design.costing : 0;

    const stock = new Stock({
      date,
      challanNo,
      designId,
      chartNo,
      partyId,
      firmId,
      qty,
      rate,
      costing,
      Amount,
      status: status || "Pending",
    });

    await stock.save();
    res.status(201).json({ message: "Stock added", stock });
  } catch (err) {
    console.error("createStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createBulkStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "No items provided" });
    }

    const designIds = [...new Set(items.map(i => i.designId))];
    const designs = await Design.find({ _id: { $in: designIds } });
    const designMap = {};
    designs.forEach(d => { designMap[d._id.toString()] = d.costing || 0; });

    const stockDocuments = items.map((item) => ({
      date: item.date,
      challanNo: item.challanNo,
      partyId: item.partyId,
      firmId: item.firmId,
      designId: item.designId,
      chartNo: item.chartNo,
      qty: item.qty,
      rate: item.rate,
      costing: designMap[item.designId.toString()] || 0,
      Amount: item.qty * item.rate,
      status: item.status || "Pending",
    }));

    const stocks = await Stock.insertMany(stockDocuments);

    res.status(201).json({ message: "Bulk stock added", stocks });
  } catch (err) {
    console.error("createBulkStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({})
      .populate("designId")
      .populate("firmId")
      .populate("partyId")
      .sort({ date: -1, challanNo: -1, createdAt: -1 });

    res.json(stocks);
  } catch (err) {
    console.error("getStocks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
    });

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ message: "Stock updated", stock });
  } catch (err) {
    console.error("updateStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ _id: req.params.id });

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ message: "Stock deleted" });
  } catch (err) {
    console.error("deleteStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
