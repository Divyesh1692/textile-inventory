const fs = require("fs");
const cloudinary = require("../utils/cloudinary");
const Design = require("../models/Design");

const createDesign = async (req, res) => {
  try {
    console.log("---- CREATE DESIGN HIT ----");
    console.log("req.body:", req.body);
    console.log(
      "req.files:",
      req.files ? req.files.map((f) => f.fieldname) : "none",
    );

    // Handle both JSON array and multipart/form-data bulk creation
    let designsArray = [];

    // Case 1: JSON body with designs array (e.g. from Postman / fetch with JSON)
    if (Array.isArray(req.body.designs)) {
      designsArray = req.body.designs;
    } else {
      // Case 2: multipart/form-data with bracket-indexed keys
      const designsMap = {};

      if (req.body) {
        Object.keys(req.body).forEach((key) => {
          const match = key.match(/designs\[(\d+)\]\[(\w+)\]/);
          if (match) {
            const idx = match[1];
            const prop = match[2];
            if (!designsMap[idx]) designsMap[idx] = {};
            designsMap[idx][prop] = req.body[key];
          }
        });
      }

      if (req.files) {
        req.files.forEach((file) => {
          const match = file.fieldname.match(/designs\[(\d+)\]\[photos\]/);
          if (match) {
            const idx = match[1];
            if (!designsMap[idx]) designsMap[idx] = {};
            if (!designsMap[idx].files) designsMap[idx].files = [];
            designsMap[idx].files.push(file);
          }
        });
      }

      designsArray = Object.values(designsMap);
    }

    if (designsArray.length > 0) {
      const createdDesigns = [];
      for (const d of designsArray) {
        const photos = [];
        if (d.files && d.files.length > 0) {
          for (const f of d.files) {
            const result = await cloudinary.uploader.upload(f.path);
            photos.push(result.secure_url);
            fs.unlinkSync(f.path); // cleanup
          }
        }
        const design = new Design({
          name: d.name,
          shortcode: d.shortcode || "",
          oldRate: d.oldRate || 0,
          rate: d.rate || 0,
          costing: d.costing || 0,
          diamonds: d.diamonds || 0,
          jarkan: d.jarkan || 0,
          panching: d.panching || 0,
          gala: d.gala || 0,
          photos,
        });
        await design.save();
        createdDesigns.push(design);
      }
      return res
        .status(201)
        .json({ message: "Bulk upload successful", createdDesigns });
    }

    if (req.originalUrl.includes("bulk")) {
      return res.status(400).json({
        message: "No valid designs parsed from bulk payload.",
        receivedBody: req.body,
      });
    }

    // Fallback for single application/json creation
    const {
      name,
      shortcode,
      description,
      quality,
      fabricType,
      color,
      oldRate,
      rate,
      costing,
      diamonds,
      jarkan,
      panching,
      gala,
      photos,
    } = req.body;

    const design = new Design({
      name,
      shortcode: shortcode || "",
      description,
      quality,
      fabricType,
      color,
      oldRate,
      rate,
      costing: costing || 0,
      diamonds: diamonds || 0,
      jarkan: jarkan || 0,
      panching: panching || 0,
      gala: gala || 0,
      photos: photos || [],
    });

    await design.save();
    res.status(201).json({ message: "Design created", design });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getDesigns = async (req, res) => {
  try {
    const designs = await Design.find({}).sort({ createdAt: -1 });
    res.json(designs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateDesign = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse kept existing photo URLs
    let keepPhotos = [];
    if (req.body.keepPhotos) {
      try {
        keepPhotos = JSON.parse(req.body.keepPhotos);
      } catch {
        keepPhotos = [];
      }
    }

    // Upload new photos to Cloudinary
    const newPhotos = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        const result = await cloudinary.uploader.upload(f.path);
        newPhotos.push(result.secure_url);
        fs.unlinkSync(f.path);
      }
    }

    const photos = [...keepPhotos, ...newPhotos];

    const updateData = {
      name: req.body.name,
      shortcode: req.body.shortcode || "",
      oldRate: req.body.oldRate || 0,
      rate: req.body.rate || 0,
      costing: req.body.costing || 0,
      diamonds: req.body.diamonds || 0,
      jarkan: req.body.jarkan || 0,
      panching: req.body.panching || 0,
      gala: req.body.gala || 0,
      photos,
    };

    const design = await Design.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    );

    if (!design) return res.status(404).json({ message: "Design not found" });

    res.json({ message: "Design updated", design });
  } catch (err) {
    console.error("updateDesign error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;

    const design = await Design.findOneAndDelete({ _id: id });

    if (!design) return res.status(404).json({ message: "Design not found" });

    res.json({ message: "Design deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
};
