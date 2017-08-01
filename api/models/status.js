'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var StatusSchema = new mongoose.Schema({
	id: { type: Number},
    name: { type: String, required: true}, 
    colour:  { type: String, required: true},
}, {
    timestamps: true
});

var Status = mongoose.model('Status', StatusSchema);
module.exports = Status;
    