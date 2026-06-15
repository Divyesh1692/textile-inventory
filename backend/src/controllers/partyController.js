const Party = require("../models/Party");

const createParty = async (req, res) => {
  try {
    const { name, address, gst } = req.body;

    const party = new Party({
      name,
      address,
      gst,

    });

    await party.save();
    res.status(201).json({ message: "Party created", party });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllParties = async (req, res) => {
  try {
    const parties = await Party.find({
 }).sort({
      createdAt: -1,
    });
    res.json(parties);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateParty = async (req, res) => {
  try {
    const { id } = req.params;

    const party = await Party.findOneAndUpdate({ _id: id,
 }, req.body, {
      new: true,
    });

    if (!party) return res.status(404).json({ message: "Party not found" });

    res.json({ message: "Party updated", party });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteParty = async (req, res) => {
  try {
    const { id } = req.params;

    const party = await Party.findOneAndDelete({
      _id: id,

    });

    if (!party) return res.status(404).json({ message: "Party not found" });

    res.json({ message: "Party deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createParty, getAllParties, updateParty, deleteParty };
