'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var visitSurveySchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo'},
    feedback: [{
        question: { type: String}, 
        questionType: { type: String}, 
        answer:{ type: String }
     }],   
    extraComment:  { type: String}, 
}, {
    timestamps: true
});

var VisitSurvey = mongoose.model('VisitSurvey', visitSurveySchema);
module.exports = VisitSurvey;
    

