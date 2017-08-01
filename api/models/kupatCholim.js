'use strict';

var mongoose = require('mongoose'),
    constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var kupatSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    email: { type: String, required: true },
    price: { type: Number, required: true },
    weekendDayRange: { type: String },
    weekendPrice: { type: Number },
    weekendPriceSet: [
        {
            title: { type: String },
            price: { type: Number },
            dateRange: { type: String },
        }
    ],
}, {
        timestamps: true
});

var Kupat = mongoose.model('Kupat', kupatSchema);
module.exports = Kupat;
