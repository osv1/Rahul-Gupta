'use strict';

var mongoose = require('mongoose');

var settingSchema = mongoose.Schema({
    ip: {
        type: String
    },
    clientId: {
        type: String
    },
    clientUsername: {
        type: String
    },
    clientPassword: {
        type: String
    },
    surveyEnLink: {
        type: String
    },
    surveyHwLink: {
        type: String
    },
    isSurveyEnEnabled: { type: Boolean, default: false },
    isSurveyHwEnabled: { type: Boolean, default: false },
}, {
    timestamps: true
});

var Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
