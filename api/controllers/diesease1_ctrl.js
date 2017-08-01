'use strict';

var mongoose = require('mongoose'),
    Disease = mongoose.model('Disease'),
    Disease = require('../models/disease'),
    Response = require('../lib/response.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    validator = require('validator'),
    utility = require('../lib/utility.js'),
    async = require('async'),
    co = require('co');


module.exports = {
    addDisease: addDisease,
};

/**
 * Function is add new disease
 * @access private
 * @return json
 * Created by swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 19-April-2017
 */
function addDisease(req, res) {
    if (!req.body.name || !req.body.nurseTest || !req.body.doctorTest) {
        return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
    } else {
        Disease.existCheck(req.body.name, '', function(err, exist) {
            if (err) {
                return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
            } else {
                if (exist != true) {
                    return res.json(Response(402, "failed", exist));
                } else {
                    var obj = { name: req.body.name, nurseTest: req.body.nurseTest, doctorTest:req.body.doctorTest};
                    new Disease(obj).save(function(err, data) {
                        if (err) {
                            return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
                        } else {
                            return res.json(Response(200, "success", constantsObj.messages.DiseaseSuccess, data));
                        }
                    });
                }
            }
        });
    }
}

