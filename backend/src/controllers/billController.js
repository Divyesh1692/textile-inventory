const Bill = require("../models/Bill");
const Challan = require("../models/Challan");

exports.createBill = async (req, res) => {
  try {
    const {
      billNumber,
      challanIds,
      partyId,
      firmId,
      date,
      isGst,
      discountPct,
      notes,
    } = req.body;

    if (!challanIds || challanIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No challans provided for the bill." });
    }

    let grossTotal = 0;

    for (const challanId of challanIds) {
      const challan = await Challan.findById(challanId);
      if (!challan) {
        return res
          .status(404)
          .json({ message: `Challan not found for ID: ${challanId}` });
      }
      if (challan.status === "Billed") {
        return res.status(400).json({
          message: `Challan ${challan.challanNumber} is already billed.`,
        });
      }
      for (const item of challan.items) {
        grossTotal += item.qty * item.rate;
      }
    }

    const pct = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
    const discountAmount = parseFloat(((grossTotal * pct) / 100).toFixed(2));
    const amountBeforeGst = parseFloat(
      (grossTotal - discountAmount).toFixed(2),
    );
    let cgst = 0;
    let sgst = 0;
    let totalAmount = amountBeforeGst;

    if (isGst) {
      cgst = parseFloat((amountBeforeGst * 0.025).toFixed(2));
      sgst = parseFloat((amountBeforeGst * 0.025).toFixed(2));
      totalAmount = parseFloat((amountBeforeGst + cgst + sgst).toFixed(2));
    }

    const newBill = new Bill({
      billNumber,
      partyId,
      firmId,
      challanIds,
      isGst: !!isGst,
      discountPct: pct,
      discountAmount,
      grossTotal: parseFloat(grossTotal.toFixed(2)),
      amountBeforeGst,
      cgst,
      sgst,
      totalAmount,
      date,
      notes: notes || "",
    });

    const savedBill = await newBill.save();

    // Mark challans as Billed
    for (const challanId of challanIds) {
      await Challan.findByIdAndUpdate(challanId, { status: "Billed" });
    }

    res.status(201).json(savedBill);
  } catch (error) {
    console.error("Error creating bill:", error);
    res
      .status(500)
      .json({ message: "Server error creating bill", error: error.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      billNumber,
      partyId,
      firmId,
      date,
      isGst,
      discountPct,
      challanIds,
      notes,
    } = req.body;

    const bill = await Bill.findOne({ _id: id });
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    if (!challanIds || challanIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No challans provided for the bill." });
    }

    // Determine added and removed challans
    const oldChallanIdsStr = bill.challanIds.map((cId) => cId.toString());
    const newChallanIdsStr = challanIds.map((cId) => cId.toString());
    const removedIds = oldChallanIdsStr.filter(
      (cId) => !newChallanIdsStr.includes(cId),
    );
    const addedIds = newChallanIdsStr.filter(
      (cId) => !oldChallanIdsStr.includes(cId),
    );

    // Recalculate amounts using provided challanIds
    let grossTotal = 0;
    for (const challanId of challanIds) {
      const challan = await Challan.findById(challanId);
      if (challan) {
        if (
          addedIds.includes(challanId.toString()) &&
          challan.status === "Billed"
        ) {
          return res.status(400).json({
            message: `Challan ${challan.challanNumber} is already billed.`,
          });
        }
        for (const item of challan.items) {
          grossTotal += item.qty * item.rate;
        }
      } else {
        return res
          .status(404)
          .json({ message: `Challan not found for ID: ${challanId}` });
      }
    }

    const pct = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
    const discountAmount = parseFloat(((grossTotal * pct) / 100).toFixed(2));
    const amountBeforeGst = parseFloat(
      (grossTotal - discountAmount).toFixed(2),
    );
    let cgst = 0;
    let sgst = 0;
    let totalAmount = amountBeforeGst;

    if (isGst) {
      cgst = parseFloat((amountBeforeGst * 0.025).toFixed(2));
      sgst = parseFloat((amountBeforeGst * 0.025).toFixed(2));
      totalAmount = parseFloat((amountBeforeGst + cgst + sgst).toFixed(2));
    }

    // Update challan statuses
    for (const rid of removedIds) {
      await Challan.findByIdAndUpdate(rid, { status: "Delivered" });
    }
    for (const aid of addedIds) {
      await Challan.findByIdAndUpdate(aid, { status: "Billed" });
    }

    bill.challanIds = challanIds;
    bill.billNumber = billNumber || bill.billNumber;
    bill.partyId = partyId || bill.partyId;
    bill.firmId = firmId || bill.firmId;
    bill.date = date || bill.date;
    bill.isGst = !!isGst;
    bill.discountPct = pct;
    bill.discountAmount = discountAmount;
    bill.grossTotal = parseFloat(grossTotal.toFixed(2));
    bill.amountBeforeGst = parseFloat(amountBeforeGst.toFixed(2));
    bill.cgst = cgst;
    bill.sgst = sgst;
    bill.totalAmount = totalAmount;
    if (notes !== undefined) bill.notes = notes;

    const updatedBill = await bill.save();
    res.status(200).json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    res
      .status(500)
      .json({ message: "Server error updating bill", error: error.message });
  }
};

exports.markBillPrinted = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOneAndUpdate(
      { _id: id },
      { status: "Printed" },
      { new: true },
    );
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({
      message: "Server error marking bill printed",
      error: error.message,
    });
  }
};

exports.markBillPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOneAndUpdate(
      { _id: id },
      { status: "Paid" },
      { new: true },
    );
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({
      message: "Server error marking bill paid",
      error: error.message,
    });
  }
};

exports.getNextBillNumber = async (req, res) => {
  try {
    const { firmId } = req.query;
    let query = {};
    if (firmId) {
      query.firmId = firmId;
    }
    const bills = await Bill.find(query, "billNumber");
    console.log(`[getNextBillNumber] firmId=${firmId}, found ${bills.length} bills`, bills.map(b=>b.billNumber));
    let maxNum = 0;
    let maxPrefix = "";
    let maxNumStr = "";

    bills.forEach((b) => {
      if (b.billNumber) {
        const match = b.billNumber.match(/(.*?)(\d+)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          if (num > maxNum) {
            maxNum = num;
            maxPrefix = match[1];
            maxNumStr = match[2];
          }
        }
      }
    });

    let nextBillStr = "1";
    if (maxNum > 0) {
      const nextNum = maxNum + 1;
      nextBillStr = `${maxPrefix}${nextNum.toString().padStart(maxNumStr.length, "0")}`;
    } else if (bills.length > 0) {
      const lastBill = await Bill.findOne(query).sort({ createdAt: -1 });
      if (lastBill && lastBill.billNumber) {
        nextBillStr = lastBill.billNumber + "-1";
      }
    }
    res.status(200).json({ nextBillNumber: nextBillStr });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching next number",
      error: error.message,
    });
  }
};

exports.getBills = async (req, res) => {
  try {
    const bills = await Bill.find({})
      .populate("partyId", "name address gst")
      .populate("firmId", "name address gst phone")
      .populate({
        path: "challanIds",
        populate: [
          { path: "partyId", select: "name" },
          { path: "firmId", select: "name" },
          { path: "items.designId", select: "name rate shortcode" },
        ],
      })
      .sort({ createdAt: -1 });
    res.status(200).json(bills);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching bills", error: error.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id })
      .populate("partyId", "name address gst")
      .populate("firmId", "name address gst phone")
      .populate({
        path: "challanIds",
        populate: [
          { path: "partyId", select: "name" },
          { path: "firmId", select: "name" },
          { path: "items.designId", select: "name rate shortcode" },
        ],
      });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching bill", error: error.message });
  }
};
