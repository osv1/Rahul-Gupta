'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var VisitStageSchema = new mongoose.Schema({
    visitId: { type: Schema.Types.ObjectId, ref: 'VisitInfo' }, 
    mainStage:[
         {
            name: { type: String},
            isCompleted: { type: Number, default: 0 },
            editedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
            updatedAt: { type: Date },
            createdAt: { type: Date }
         }
    ],
    stages: [
        {
            name: { type: String},
            isCompleted: { type: Number, default: 0 },
            editedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
            updatedAt: { type: Date },
            createdAt: { type: Date }
        }
    ]
}, {
    timestamps: true
});

var VisitStage = mongoose.model('VisitStage', VisitStageSchema);
module.exports = VisitStage;
    
