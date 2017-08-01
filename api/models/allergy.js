'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var AllergySchema = new mongoose.Schema({
    name: { type: String, required: true}, 
}, {
    timestamps: true
});

var Allergy = mongoose.model('Allergy', AllergySchema);
module.exports = Allergy;
    

