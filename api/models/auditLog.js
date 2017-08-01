'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var auditLogSchema = new mongoose.Schema({
    entityname: { type: String},  //table name
    modifiedDetails: [{ }],           //[{name, oldvalue, newValue}, {name, oldvalue, newValue}]
    actionBy: { type: Schema.Types.ObjectId, ref: 'User' },
    actionName: { type: String, enum: ['Create', 'Edit', 'Remove'] },
    actionSubName:  { type: String},
    actionFor :{ type: String },
    entityId: { type: String},
    description: { type: String}
}, {
    timestamps: true
});

var AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
   
