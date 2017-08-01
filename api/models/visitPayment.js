'use strict';

var mongoose = require('mongoose'),
    constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var visitPaymentSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' },
    billList: [
        {
            visitPayment:  { type: Number, default: 0 },
            billableItems:[{
                name: { type: String },
                price: { type: Number, default: 0 },
              }
            ],
            isBillPayed: { type: Boolean, default: false },
            paymentType: { type: String },
            previousDebt: { type: Number, default: 0 },
            currency: { type: String},
            isDocIssued:  { type: Boolean, default: false },
            invoiceIssuedData:{
                 docnum: { type: String },
                 doc_url: { type: String },
                 doc_copy_url: { type: String },
            },
            debtDocNum: { type: String },
        }
    ]
}, {
        timestamps: true
});

var VisitPayment = mongoose.model('VisitPayment', visitPaymentSchema);
module.exports = VisitPayment;