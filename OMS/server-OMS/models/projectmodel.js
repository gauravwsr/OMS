const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  assignedEmployees: [{ id: Number, name: String, role: String }],
  productProcedure: String,
  ppt: String,
  coveringLetter: String,
  assignTeamLead: { type: String, default: null }, // New field
  tasks: [
    {
      name: String,
      status: String,
      dueDate: Date,
      completed: Boolean,
    }
  ], // New field
  externalId: String, // To track the original ID from remote API
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

projectSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;