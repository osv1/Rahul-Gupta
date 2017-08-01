'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var patientTestSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
    nurseTestTakenBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
    doctorTestTakenBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
    nurseTest: [{
        name: { type: String },
        comment: { type: String },
        diseaseId: { type: Schema.Types.ObjectId, ref: 'Disease' }
     }],  
    doctorTest:[{
        name: { type: String },
        comment: { type: String },
        diseaseId: { type: Schema.Types.ObjectId, ref: 'Disease' },
     }],   
}, {
    timestamps: true
});

var PatientTest = mongoose.model('PatientTest', patientTestSchema);
module.exports = PatientTest;
    
