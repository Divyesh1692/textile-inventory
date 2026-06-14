const Firm = require("../models/Firm");

const createFirm = async (req, res) => {
  try {
    const { name, gst, address } = req.body;

    const firm = new Firm({
      name,
      gst,
      address,
      companyId: req.user.companyId,
    });

    await firm.save();
    res.status(201).json({ message: "Firm created", firm });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getFirms = async (req, res) => {
  try {
    const firms = await Firm.find({ companyId: req.user.companyId });
    res.json(firms);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateFirm = async (req, res) => {
  try {
    const { id } = req.params;

    const firm = await Firm.findOneAndUpdate({ _id: id, companyId: req.user.companyId }, req.body, {
      new: true,
    });

    if (!firm) return res.status(404).json({ message: "Firm not found" });

    res.json({ message: "Firm updated", firm });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteFirm = async (req, res) => {
  try {
    const { id } = req.params;

    const firm = await Firm.findOneAndDelete({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!firm) return res.status(404).json({ message: "Firm not found" });

    res.json({ message: "Firm deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createFirm, getFirms, updateFirm, deleteFirm };
