const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    siteName: String,
    description: String,
    dates: [
      {
        year: Number,
        type: String,
      },
    ],
    designated: String,
    image: String,
    location: {
      latitude: Number,
      longitude: Number,
      town: String,
    },
    provinceOrTerritory: {
      code: String,
      name: String,
      region: String,
    },
  },
  { strict: false }
);

module.exports = siteSchema;