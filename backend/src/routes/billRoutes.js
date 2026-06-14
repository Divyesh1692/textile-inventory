const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");

router.post("/add", billController.createBill);
router.put("/update/:id", billController.updateBill);
router.patch("/mark-printed/:id", billController.markBillPrinted);
router.patch("/mark-paid/:id", billController.markBillPaid);
router.get("/get-next-number", billController.getNextBillNumber);
router.get("/get-all", billController.getBills);
router.get("/get/:id", billController.getBillById);

module.exports = router;
