const express = require("express");
const multer = require("multer");
const os = require("os");
const {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
} = require("../controllers/designController");

const auth = require("../middleware/authMiddleware");

const upload = multer({ dest: os.tmpdir() });
const router = express.Router();

router.post("/add-bulk", auth, upload.any(), createDesign);
router.get("/get-all", auth, getDesigns);
router.put("/:id", auth, upload.any(), updateDesign);
router.delete("/:id", auth, deleteDesign);

module.exports = router;
