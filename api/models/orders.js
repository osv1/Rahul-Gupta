'use strict';

var mongoose = require('mongoose'),
    constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var orderSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
    emcOrder: [
        {
            orderGivenBy: { type: Schema.Types.ObjectId, ref: 'User' },
            prescriptionAmount: { type: Number, default: 0 },
            givenAmount: { type: Number, default: 0 },
            dosage: { type: String },
            drugName: { type: String },
            given: { type: String, enum: ['Yes', 'No', 'Some'], default: 'No' },
            description: { type: String },
        }
    ],
    extOrder: [
        {
            prescriptionAmount: { type: Number, default: 0 },
            dosage: { type: String },
            drugName: { type: String },
            description: { type: String },
        }
    ]
}, {
        timestamps: true
});

var Order = mongoose.model('Order', orderSchema);
module.exports = Order;

// var orderSchema = new mongoose.Schema({
//     visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
//     orderType:  { type: String, enum: ['EMC', 'External'], default: 'EMC' },
//     orderGivenBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
//     prescriptionAmount: { type: Number, default: 0}, 
//     givenAmount: { type: Number, default: 0}, 
//     dosage: { type: String},
//     drugName: { type: String},
//     given: { type: String, enum: ['Yes', 'No', 'Some'], default: 'No' },
//     description: { type: String},
// }, {
//     timestamps: true
// });