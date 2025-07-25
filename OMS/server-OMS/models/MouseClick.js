const mongoose = require("mongoose");

const MouseClickSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MouseClick", MouseClickSchema);
