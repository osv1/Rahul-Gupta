'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var ReportHistorySchema = new mongoose.Schema({
    type:  { type: String},
    reportInfo: [
        {
            filename: { type: String},
            generatedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date},
        }
    ]
}, {
    timestamps: true
});

var ReportHistory = mongoose.model('ReportHistory', ReportHistorySchema);
module.exports = ReportHistory;
    
