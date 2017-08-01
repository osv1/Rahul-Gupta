'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var TriagePatientTestSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
    triageTest: [{
       pulse: {type: Number},
       saturation: {type: Number},
       weight:  {type: Number},
       bloodPressure: { minValue: {type: Number},
                         maxValue: {type: Number}},
       temperature: {type: Number},
       breadthPerMinute: {type: Number},   
       created_at: { type: Date, default: Date.now },
       testTakenBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
     }],   
}, {
    timestamps: true
});

var TriagePatientTest = mongoose.model('TriagePatientTest', TriagePatientTestSchema);
module.exports = TriagePatientTest;
    

