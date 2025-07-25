const mongoose = require("mongoose");

const ScrollDataSchema = new mongoose.Schema({
    scrollPercentage: Number,
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ScrollData", ScrollDataSchema);
