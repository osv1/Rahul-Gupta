'use strict';

var mongoose = require('mongoose'),
    formidable = require('formidable'),
    constantsObj = require('./../../constants'),
    Response = require('../lib/response.js'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    async = require('async'),
    validator = require('validator'),
    _ = require('underscore'),
   // common = require('../../config/common.js'),
    utility = require('../lib/utility.js'),
    config = require('../../config/config.js'),
    AuditLog =  mongoose.model('AuditLog'),
    co = require('co');


module.exports = {
   addAuditLog: addAuditLog
};

/**
 * Function is use to Patient 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function addAuditLog(entityname, actionBy, actionName, actionSubName, modifiedDetails) {
  return new Promise(function (resolve, reject) {
   new AuditLog({
        entityname : entityname,
        actionBy: actionBy,
        actionName: actionName,
        actionSubName: actionSubName,
        modifiedDetails: modifiedDetails,
    }).save(function (err, auditLog) {
        if (err) {
            reject(err);
        }
        else {
           resolve(auditLog);
        }
    });
  });
}
