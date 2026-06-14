const Stock = require("../models/Stock");

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
    } = req.body;

    const stock = new Stock({
      date,
      challanNo,
      designId,
      chartNo,
      partyId,
      firmId,
      qty,
      rate,
      Amount,
      companyId: req.user.companyId,
    });

    await stock.save();
    res.status(201).json({ message: "Stock added", stock });
  } catch (err) {
    console.error("createStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({ companyId: req.user.companyId })
      .populate("designId")
      .populate("firmId")
      .populate("partyId")
      .sort({ createdAt: -1 });

    res.json(stocks);
  } catch (err) {
    console.error("getStocks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, req.body, {
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
    const stock = await Stock.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ message: "Stock deleted" });
  } catch (err) {
    console.error("deleteStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
