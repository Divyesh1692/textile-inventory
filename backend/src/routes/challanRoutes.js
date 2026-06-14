const express = require("express");
const router = express.Router();
const challanController = require("../controllers/challanController");

router.post("/add", challanController.createChallan);
router.put("/update/:id", challanController.updateChallan);
router.patch("/mark-printed/:id", challanController.markChallanPrinted);
router.get("/get-next-number", challanController.getNextChallanNumber);
router.get("/get-all", challanController.getChallans);
router.get("/get/:id", challanController.getChallanById);

module.exports = router;
