const ChargeHandover = require("../models/chargeHandoverModel");
const User = require("../models/userModel");
const Candidate = require("../models/Candidate");

// Create a new charge handover
const createChargeHandover = async (req, res) => {
  try {
    const {
      fromEmployeeId,
      toEmployeeId,
      handoverDate,
      department,
      responsibilities,
      assets,
      documents,
      notes,
    } = req.body;

    // Verify the user is HR Manager
    const currentUser = await User.findOne({ userId: req.user.userId });
    if (
      !currentUser ||
      currentUser.role !== "Admin" ||
      currentUser.subRole !== "HR Manager"
    ) {
      return res.status(403).json({
        message: "Access denied. Only HR Managers can create charge handovers.",
      });
    }

    // Validate that from and to employees are different
    if (fromEmployeeId === toEmployeeId) {
      return res.status(400).json({
        message: "From employee and to employee cannot be the same.",
      });
    }

    // Check if IDs are valid ObjectIds
    const mongoose = require("mongoose");
    const fromIsValidObjectId = mongoose.Types.ObjectId.isValid(fromEmployeeId);
    const toIsValidObjectId = mongoose.Types.ObjectId.isValid(toEmployeeId);

    // Verify both candidates exist
    const fromEmployee = await Candidate.findOne(
      fromIsValidObjectId
        ? { $or: [{ candidateId: fromEmployeeId }, { _id: fromEmployeeId }] }
        : { candidateId: fromEmployeeId }
    );
    const toEmployee = await Candidate.findOne(
      toIsValidObjectId
        ? { $or: [{ candidateId: toEmployeeId }, { _id: toEmployeeId }] }
        : { candidateId: toEmployeeId }
    );

    if (!fromEmployee) {
      return res.status(404).json({ message: "From candidate not found." });
    }

    if (!toEmployee) {
      return res.status(404).json({ message: "To candidate not found." });
    }

    const chargeHandover = new ChargeHandover({
      fromEmployeeId: fromEmployee.candidateId, // Use the actual candidateId for storage
      toEmployeeId: toEmployee.candidateId, // Use the actual candidateId for storage
      handoverDate: new Date(handoverDate),
      department,
      responsibilities,
      assets,
      documents,
      notes,
      createdBy: req.user.userId,
      status: "Pending",
    });

    await chargeHandover.save();

    res.status(201).json({
      message: "Charge handover created successfully",
      handover: chargeHandover,
    });
  } catch (error) {
    console.error("Error creating charge handover:", error);
    res.status(500).json({
      message: "Failed to create charge handover",
      error: error.message,
    });
  }
};

// Get all charge handovers
const getAllChargeHandovers = async (req, res) => {
  try {
    const currentUser = await User.findOne({ userId: req.user.userId });

    // Only HR Managers can view all handovers
    if (
      !currentUser ||
      currentUser.role !== "Admin" ||
      currentUser.subRole !== "HR Manager"
    ) {
      return res.status(403).json({
        message: "Access denied. Only HR Managers can view charge handovers.",
      });
    }

    const handovers = await ChargeHandover.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(handovers);
  } catch (error) {
    console.error("Error fetching charge handovers:", error);
    res.status(500).json({
      message: "Failed to fetch charge handovers",
      error: error.message,
    });
  }
};

// Get a specific charge handover by ID
const getChargeHandoverById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // Only HR Managers can view handovers
    if (
      !currentUser ||
      currentUser.role !== "Admin" ||
      currentUser.subRole !== "HR Manager"
    ) {
      return res.status(403).json({
        message: "Access denied. Only HR Managers can view charge handovers.",
      });
    }

    const handover = await ChargeHandover.findById(id);

    if (!handover) {
      return res.status(404).json({ message: "Charge handover not found." });
    }

    res.status(200).json(handover);
  } catch (error) {
    console.error("Error fetching charge handover:", error);
    res.status(500).json({
      message: "Failed to fetch charge handover",
      error: error.message,
    });
  }
};

// Update charge handover status
const updateChargeHandoverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // Only HR Managers can update handovers
    if (
      !currentUser ||
      currentUser.role !== "Admin" ||
      currentUser.subRole !== "HR Manager"
    ) {
      return res.status(403).json({
        message: "Access denied. Only HR Managers can update charge handovers.",
      });
    }

    const validStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const updateData = { status };

    // Add timestamps for specific status changes
    if (status === "Completed") {
      updateData.completedAt = new Date();
      updateData.approvedBy = req.user.userId;
      updateData.approvedAt = new Date();
    }

    // Add comment if provided
    if (comments) {
      updateData.$push = {
        comments: {
          userId: req.user.userId,
          comment: comments,
          timestamp: new Date(),
        },
      };
    }

    const handover = await ChargeHandover.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!handover) {
      return res.status(404).json({ message: "Charge handover not found." });
    }

    res.status(200).json({
      message: "Charge handover updated successfully",
      handover,
    });
  } catch (error) {
    console.error("Error updating charge handover:", error);
    res.status(500).json({
      message: "Failed to update charge handover",
      error: error.message,
    });
  }
};

// Delete a charge handover
const deleteChargeHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // Only HR Managers can delete handovers
    if (
      !currentUser ||
      currentUser.role !== "Admin" ||
      currentUser.subRole !== "HR Manager"
    ) {
      return res.status(403).json({
        message: "Access denied. Only HR Managers can delete charge handovers.",
      });
    }

    const handover = await ChargeHandover.findByIdAndDelete(id);

    if (!handover) {
      return res.status(404).json({ message: "Charge handover not found." });
    }

    res.status(200).json({
      message: "Charge handover deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting charge handover:", error);
    res.status(500).json({
      message: "Failed to delete charge handover",
      error: error.message,
    });
  }
};

// Get handovers for a specific employee
const getEmployeeHandovers = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // HR Managers can view any employee's handovers, employees can only view their own
    const isHRManager =
      currentUser &&
      currentUser.role === "Admin" &&
      currentUser.subRole === "HR Manager";
    const isOwnRecord = req.user.userId === employeeId;

    if (!isHRManager && !isOwnRecord) {
      return res.status(403).json({
        message: "Access denied. You can only view your own handovers.",
      });
    }

    const handovers = await ChargeHandover.find({
      $or: [{ fromEmployeeId: employeeId }, { toEmployeeId: employeeId }],
    }).sort({ createdAt: -1 });

    res.status(200).json(handovers);
  } catch (error) {
    console.error("Error fetching employee handovers:", error);
    res.status(500).json({
      message: "Failed to fetch employee handovers",
      error: error.message,
    });
  }
};

module.exports = {
  createChargeHandover,
  getAllChargeHandovers,
  getChargeHandoverById,
  updateChargeHandoverStatus,
  deleteChargeHandover,
  getEmployeeHandovers,
};
