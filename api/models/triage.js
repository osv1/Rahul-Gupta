'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var TriageSchema = new mongoose.Schema({
    name: { type: String}, // Pluse, Saturation, weight, Blood Pressure, Temperature, Breadth/minute  
    indexValueType: { type: String, required: true}, //Type(Boolean/Numeric)
    indexType:{ type: String, enum: ['Disease', 'Triage'], default: 'Triage' },
    minRange: { type: Number },
    maxRange: { type: Number },
    value: { type: String },
    alertFreqency: { type: Number },
     key: { type: String}, 
    indexDescription:  { type: String, required: true},
}, {
    timestamps: true
});

var Triage = mongoose.model('Triage', TriageSchema);
module.exports = Triage;
    
