const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  employeeRole: {
    type: String,
    required: true
  },
  leaveReason: {
    type: String,
    required: true,
    trim: true
  },
  leaveDates: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['Sick Leave', 'Vacation', 'Personal Leave', 'Emergency Leave', 'Other']
  },
  customLeaveType: {
    type: String,
    required: function() {
      return this.leaveType === 'Other';
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedDate: {
    type: Date,
    default: null
  },
  reviewComments: {
    type: String,
    default: ''
  },
  totalDays: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Calculate total days before saving
leaveSchema.pre('save', function(next) {
  if (this.leaveDates.start && this.leaveDates.end) {
    const startDate = new Date(this.leaveDates.start);
    const endDate = new Date(this.leaveDates.end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    this.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
