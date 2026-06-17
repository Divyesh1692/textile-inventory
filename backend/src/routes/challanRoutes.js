const express = require("express");
const router = express.Router();
const challanController = require("../controllers/challanController");

router.post("/add", challanController.createChallan);
router.post("/bulk", challanController.createBulkChallan);
router.put("/update/:id", challanController.updateChallan);
router.patch("/mark-printed/:id", challanController.markChallanPrinted);
router.get("/get-next-number", challanController.getNextChallanNumber);
router.get("/get-all", challanController.getChallans);
router.get("/get/:id", challanController.getChallanById);
router.delete("/delete/:id", challanController.deleteChallan);

module.exports = router;
