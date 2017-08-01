'use strict';

var mongoose = require('mongoose'),
    constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var alertSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
    alertType: { type: String, enum: ['Disease', 'Triage'], default: 'Triage' },
    triages: [
        {
            name: { type: String },
            value: { type: String },
            alertInterval: { type: Number },
            time: { type: Date },
        }
    ],
    diseases: [
        {  
            name: { type: String },
            alertInterval: { type: Number },
        }
    ],
    status: { type: Number, default: 1 },
}, {
        timestamps: true
});

var Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;

