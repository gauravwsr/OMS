const mongoose = require('mongoose');

const ScheduleEventDataSchema = new mongoose.Schema({
  StartTime: { type: Date},
  CreateBy:{type:String},
  EndTime: { type: Date },
  Subject: { type: String },
  Description:{type: String},
  Location : {type:String},
  Users:{type:[String]},
  IsAllDay: { type: Boolean },
  StartTimezone: { type: String },
  EndTimezone: { type: String },
  RecurrenceRule: { type: String },
  RecurrenceID: { type: String },
  RecurrenceException: { type: String }
});

const ScheduleEventData = mongoose.model('ScheduleEventData', ScheduleEventDataSchema);

module.exports = ScheduleEventData;
