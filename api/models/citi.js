'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var CitiSchema = new mongoose.Schema({
    name: { type: String, required: true}, 
}, {
    timestamps: true
});

var Citi = mongoose.model('Citi', CitiSchema);
module.exports = Citi;
    

