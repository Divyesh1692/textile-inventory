const express = require("express");
const {
  createParty,
  getAllParties,
  updateParty,
  deleteParty,
} = require("../controllers/partyController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes
router.post("/add", createParty);
router.get("/get-all", getAllParties);
router.put("/:id", updateParty);
router.delete("/:id", deleteParty);

module.exports = router;
