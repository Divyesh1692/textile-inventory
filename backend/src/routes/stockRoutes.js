const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const stockCtrl = require("../controllers/stockController");

router.post("/add", auth, stockCtrl.createStock);
router.post("/bulk", auth, stockCtrl.createBulkStock);
router.get("/get-all", auth, stockCtrl.getStocks);
router.put("/:id", auth, stockCtrl.updateStock);
router.delete("/:id", auth, stockCtrl.deleteStock);

module.exports = router;
