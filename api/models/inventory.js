'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var inventorySchema = new mongoose.Schema({
	drugName: { type: String},
    drugDetails:[{
    				dosage: { type: String},
    				quantity:{ type:Number, default:0},
					updateQuantity:{ type: String},
    			}] 
}, {
    timestamps: true
});

var Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
    
