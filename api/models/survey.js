'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var surveySchema = new mongoose.Schema({
    name: { type: String},
    question: [{
        description: { type: String}, 
        type: { type: String}, 
    }],
    level: [{
        type: String,
    }]
}, {
    timestamps: true
});

var Survey = mongoose.model('Survey', surveySchema);
module.exports = Survey;
    

    