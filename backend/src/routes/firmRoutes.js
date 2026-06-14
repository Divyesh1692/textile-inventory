const express = require("express");
const {
  createFirm,
  getFirms,
  updateFirm,
  deleteFirm,
} = require("../controllers/firmController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", createFirm);
router.get("/get-all", getFirms);
router.put("/:id", updateFirm);
router.delete("/:id", deleteFirm);

module.exports = router;
