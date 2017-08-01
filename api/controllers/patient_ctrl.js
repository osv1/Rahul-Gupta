'use strict';

var mongoose = require('mongoose'),
    Patient = mongoose.model('Patient'),
    User = mongoose.model('User'),
    Kupat = mongoose.model('Kupat'),
    Visit = mongoose.model('VisitInfo'),
    VisitStage = mongoose.model('VisitStage'),    
    Citi =  mongoose.model('Citi'),
    Status = mongoose.model('Status'),
    Response = require('../lib/response.js'),
    constantsObj = require('./../../constants'),
    fs = require('fs-extra'),
    utility = require('../lib/utility.js'),
    moment = require('moment-timezone'),
    co = require('co'),
    moment = require('moment-timezone'),
    async = require('async'),  
     path = require('path'),
     AuditLogController = require('./auditlog_ctrl'),
    moment_durationFormat = require("moment-duration-format");

module.exports = {
    addPatient: addPatient,
    getActivePatientList : getActivePatientList,
    getPatientById: getPatientById,
    getAllPatient: getAllPatient,
    getPatientVisitHistory: getPatientVisitHistory,
    getFamilyDoctor: getFamilyDoctor,
    getKCforpatientId: getKCforpatientId,
    patientDashboardCount: patientDashboardCount,
    uploadFile: uploadFile,
    download: download,
    getCities: getCities,
    getPatientDashboardCount: getPatientDashboardCount,
    viewVisitDocument: viewVisitDocument,
    getActivePatientListByDr: getActivePatientListByDr
};


/**
 * Function is use to Patient 
 * @access private
 * @return json
 * Created by Swapnali
 * Modified by Sunny:
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
  */    
function addPatient(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        //check if citi present in db if not add else skip
        var citiToAdd = (req.body.city).toLowerCase();
        let citiInfo = yield Citi.findOne({ name: citiToAdd }).exec();
        if (!citiInfo) {
            let savedCitiData = yield new Citi({
                "name": citiToAdd
            }).save();
        }
        var patientId = req.body.patientId;
        if (!req.body.patientId || patientId == '') {
            //auto generate patient id
            patientId = yield generatePatientId();
          //  console.log("Generated patient id in add patient", patientId);
        }
        var fieldNotToEncrypt = ['_id', 'familyDoctorId', 'kupatCholim', 'comment','fatherName', 'motherName', 'age','status','DOB','email','fileName','allergies','medicalHistory', 'isPersonnel' ];
        let savedData = yield Patient.findById(req.body._id);
        if (savedData) {
            var oldData = savedData;
            savedData.patientId = utility.getEncryptText(patientId);;
            savedData.firstname = utility.getEncryptText((req.body.firstname).toLowerCase());
            savedData.lastname = utility.getEncryptText((req.body.lastname).toLowerCase());
            savedData.name = utility.getEncryptText((req.body.firstname).toLowerCase() + ' ' + (req.body.lastname).toLowerCase());
            savedData.fatherName = req.body.fatherName;
            savedData.motherName = req.body.motherName;
            savedData.age = req.body.age;
            savedData.gender = utility.getEncryptText(req.body.gender);
            savedData.kupatCholim = req.body.kupatCholim;
            savedData.DOB = req.body.DOB;
            savedData.secondaryNo = utility.getEncryptText(req.body.secondaryNo);
            savedData.mobileNo = utility.getEncryptText(req.body.mobileNo);
            savedData.email = req.body.email;
            savedData.comment = req.body.comment;
            savedData.familyDoctorId = req.body.familyDoctorId;
            savedData.medicalHistory = req.body.medicalHistory;
            savedData.city = utility.getEncryptText(req.body.city);
            savedData.address = utility.getEncryptText(req.body.address);
            savedData.isPersonnel = req.body.isPersonnel;
            
            let chkData = yield savedData.save();
            var modifiedDetails = utility.getModifiedDetailsForAuditLog(oldData.toObject(), chkData.toObject(), false);
            let savedAuditLogData = yield AuditLogController.addAuditLog("Patient", userInfo._id, "Edit", "PatientChange", modifiedDetails);
            return res.json(Response(200, "success", constantmsg.patientUpdatedSuccess, {}));
        }
        else if (!savedData) {
            let isPatientIdPresent = yield Patient.findOne({ patientId:  utility.getEncryptText(patientId)  });
            if (!isPatientIdPresent) {
                req.body.patientId = patientId;
                req.body.name =  (req.body.firstname).toLowerCase() + ' ' + (req.body.lastname).toLowerCase();
                req.body.firstname = (req.body.firstname).toLowerCase();
                req.body.lastname = (req.body.lastname).toLowerCase();
                let encrytedPatientObj = utility.encryptedRecord(req.body, fieldNotToEncrypt);
                console.log('encrytedPatientObj',encrytedPatientObj);
                var modifiedDetails = utility.getModifiedDetailsForAuditLog({}, encrytedPatientObj, true);
                var patient = new Patient(encrytedPatientObj);
                patient.save(function (err, user) {
                    if (err) {
                        res.json({
                            code: 404,
                            message: utility.validationErrorHandler(err)
                        });
                    } else {
                        res.json({
                            code: 200,
                            message: constantmsg.patientCreatedSuccess,
                            data: user
                        });
                    }
                });
            } 
          else {
             return res.json(Response(402, "failed", constantmsg.patientIdAlreadyPresent));
          }
        }
        else {
             return res.json(Response(402, "failed", constantmsg.patientUpdatedFailed));
        }
        }).catch(function (err) {
            console.log("err--->", err);
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
} 

/**
 * Function is use to generate patient Id automatically
 * @access private
 * @return json
 * Created by Swapnali
 * Modified by Sunny:
 * @smartData Enterprises (I) Ltd
 * Created Date 24-June-2017
 */
function generatePatientId() {
    return new Promise(function (resolve, reject) {
        var patientId = "";
        var possible = "0123456789";
        for (var i = 0; i < 5; i++) {
            patientId += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        patientId = 'זמני' + patientId;
        Patient.findOne({ patientId: patientId }, { firstname: 1 }, function (err, patient) {
            if (err) {
              generatePatientId();
            }
            else {
                if (patient) {
                    generatePatientId(); // otherwise, recurse on generate
                }
                else {
                    resolve(patientId); // use the continuation
                }
            }
        });
    });
}

/**
 * Function is use to get active Patient list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function getActivePatientList(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let sort = utility.getSortObj(req.body);
        let count = parseInt(req.body.count ? req.body.count : 0);
        let skip = parseInt(req.body.count * (req.body.page - 1));
        var searchText = req.body.searchText;
        var condition = { visitIsClosed: 0 };
        if (searchText != undefined && searchText != 'undefined') {
           searchText = decodeURIComponent(searchText);
           searchText = (searchText).toLowerCase();
           console.log("utility.getEncryptText(searchText)--->", utility.getEncryptText(searchText)); 
            condition.$or = [
                //{ 'visitStart': new RegExp(searchText, 'gi') },
                { 'visitDuration': new RegExp(searchText, 'gi') },
                { 'visitReason': new RegExp(searchText, 'gi') },
                { 'patientInfo.age.year': new RegExp(searchText, 'gi') },
                { 'patientInfo.firstname': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.lastname': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.patientId': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.name': new RegExp(utility.getEncryptText(searchText), 'gi') },
            ];
        }
         console.log("condition--->", condition);
        let aggregate = [{
            $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patientInfo"
            }
        },
        { $unwind: "$patientInfo" },
        { $match: condition }, 
        {
            $project: {
                visitStart: 1,
                visitDuration: 1,
                visitReason: 1,
                currentStatus: 1,
                patientInfo: '$patientInfo'
            }
        }
        ];
        if (skip > 0) {
            aggregate.push({ $skip: skip });
        }
        if (count > 0) {
            aggregate.push({ $limit: count });
        }
        if (sort) {
            aggregate.push({ $sort: sort });
        }
        let activeVisits = yield Visit.aggregate(aggregate);
        if (activeVisits) {
            for (var i = 0; i < activeVisits.length; i++) {
                activeVisits[i].patientInfo.patientId = utility.getDecryptText(activeVisits[i].patientInfo.patientId);
                activeVisits[i].patientInfo.firstname = utility.getDecryptText(activeVisits[i].patientInfo.firstname);
                activeVisits[i].patientInfo.lastname = utility.getDecryptText(activeVisits[i].patientInfo.lastname);

                 var current_time = moment.utc();
                 var visitStart = moment(activeVisits[i].visitStart);
                 var diff = current_time.diff(visitStart);
                 var duration = moment.duration(diff);
                 var visitDuration = duration.format("DD hh:mm:ss");

                activeVisits[i].visitStart = visitStart.tz("Israel").format();
                activeVisits[i].visitDuration = visitDuration;
                let statusInfo = yield Status.findOne({ id: Number(activeVisits[i].currentStatus) }).lean().exec();
                activeVisits[i].statusColour = statusInfo.colour;
                activeVisits[i].statusName = statusInfo.name;
            }
        }
        var getCount = Visit.find(condition).count().exec();
        getCount.then(function (totalLength) {
            console.log("totalength:", totalLength);
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": activeVisits, "totalLength": totalLength });
        }).catch(function (err) {
            console.log("error:", err);
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
        });
    });
}
            
/**
 * Function is use to get patient by ID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function getPatientById(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let patientProfileInfo = yield Patient.findById(id).lean().exec();
        console.log('patientProfileInfo',patientProfileInfo);
        var fieldNotToDecrypt = ['_id', 'familyDoctorId', 'kupatCholim', 'comment','fatherName', 'motherName', 'age','status','DOB','email','fileName','allergies','medicalHistory', 'isPersonnel' ];
         utility.decryptedRecord(patientProfileInfo, fieldNotToDecrypt,function(patientRecord){
        console.log("Decrypted", patientRecord);
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": patientRecord});
  })
 }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get patient visit history
 * @access private
 * @return json
 * @parameter : PatientId
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 26-April-2017
 */
function getPatientVisitHistory(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitHistoryList = yield Visit.find({ patientId: utility.getEncryptText(req.body.patientId), visitIsClosed: 1 }, { visitStart: 1, visitDuration: 1, treatmentResultType: 1, visitReason: 1 } ).exec();
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": patientVisitHistoryList});
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}



/**
 * Function is use to get active Patient list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
function getAllPatient(req, res) {
    var count = req.query.count ? req.query.count : 0;
    var skip = req.query.count * (req.query.page - 1);
    var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
    var condition = {};
    //var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
    var searchText = decodeURIComponent(req.query.searchText);
   // console.log("searchtext lowercase--->", searchText.toLowerCase());
    console.log("searchtext--->", utility.getEncryptText(searchText));
    if (req.query.searchText) {
        condition.$or = [{ 'firstname': new RegExp( utility.getEncryptText(searchText.toLowerCase()), 'gi') }, { 'lastname': new RegExp(  utility.getEncryptText(searchText.toLowerCase()), 'gi') }, { 'age': new RegExp(searchText, 'gi') }, { 'patientId': new RegExp( utility.getEncryptText(searchText), 'gi') }, { 'city': new RegExp( utility.getEncryptText(searchText.toLowerCase()), 'gi') }, { 'mobileNo': new RegExp( utility.getEncryptText(searchText), 'gi') }, { 'name': new RegExp( utility.getEncryptText(searchText.toLowerCase()), 'gi') }];
    }
     console.log("condition--->", condition);
    Patient.find(condition, { patientId: 1, firstname: 1, lastname: 1, age: 1, mobileNo: 1, city: 1, status: 1, name: 1 })
        .limit(parseInt(count))
        .skip(parseInt(skip))
        .sort(sorting)
        .lean()
        .exec(function (err, patientData) {
            if (err) {
                return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
            } else {
                var getCount = Patient.find(condition).count().exec();
                getCount.then(function (totalLength) {
                    var fieldNotToDecrypt = ['_id', 'familyDoctorId', 'kupatCholim', 'comment', 'fatherName', 'motherName', 'age', 'status', 'DOB', 'fileName', 'email', 'allergies', 'medicalHistory'];

                    utility.decryptedRecord(patientData, fieldNotToDecrypt, function (patientRecord) {
                        if (patientRecord) {
                            for (var i = 0; i < patientRecord.length; i++) {
                                patientRecord[i].name = utility.capitalizeFirstLetter(patientRecord[i].firstname) + ' ' + utility.capitalizeFirstLetter(patientRecord[i].lastname);
                            }
                        }
                        return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": patientRecord, "totalLength": totalLength });
                    })
                })
                .catch(function (err) {
                        console.log("err-->", err);
                        return res.json({ 'code': 500, status: 'failure', "message": constantsObj.messages.errorRetreivingData, "data": err });
                })
            }
        })
}


/**
 * Function is use to update patient data
 * @access private
 * @return json
 * Created by Sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function updatePatient(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientData = yield Patient.findById(req.body._id);
        if (patientData) {
            let savedData = yield patientData.save();
            return res.json(Response(200, "success", constantmsg.patientUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.patientUpdatedFailed, err));    
        }
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get patient by ID
 * @access private
 * @return json
 * Created by Sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 2-may-2017
 */
function getFamilyDoctor(req, res) {
  User.find({ isFamilyDoctor:  1 ,  deleted: false }).exec(function (err, result) {
    if (err) {
      res.json({
        code: 404,
        message: constantsObj.messages.errorRetreivingData
      });
    } else if (result && result.length) {
      res.json({
        code: 200,
        message: constantsObj.messages.dataRetrievedSuccess,
        data: result
      });
    } else {
      res.json({
        code: 200,
        message: constantsObj.messages.noDataFound
      });
    }
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  });
}
/**
 * Function is use to get Kupat Cholim
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 2-may-2017
 */

function getKCforpatientId(req, res) {
  Kupat.find({}).exec(function (err, result) {
    if (err) {
      res.json({
        code: 404,
        message: constantsObj.messages.errorRetreivingData
      });
    } else if (result && result.length) {
      res.json({
        code: 200,
        message: constantsObj.messages.dataRetrievedSuccess,
        data: result
      });
    } else {
      res.json({
        code: 200,
        message: constantsObj.messages.noDataFound
      });
    }
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  });
}
/**
 * Function is use to get patient dashboard count
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-May-2017
 */
function patientDashboardCount(req, res) {
    async.parallel({
        activeVisits: function(callback) {
            Patient.find({ status: 1}).count(function(err, count){
                if (err) 
                    callback(err);
                else 
                    callback(null, count);
            });
        },
        patients: function(callback) {
            Patient.find().count(function(err, count){
                if (err) 
                    callback(err);
                else 
                    callback(null, count);
            });
        }
    }, function(err, results) {
         if (err) {
            return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
        } else {
            return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": results});
        }
    });
}

function uploadFile(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
        var userid = req.user.id;
        var file = req.swagger.params.file.value;
        var visitId = req.swagger.params.visitId.value;
        let patientVisitData = yield Visit.findById(visitId).populate('patientId').exec();
        if (patientVisitData.patientId) {
            var visitDirName = utility.getDecryptText(patientVisitData.patientId.patientId) + '/' + patientVisitData._id;
            var visitDirPath = path.resolve('./EMCDocuments/' + visitDirName);
            //create directory for visit if not created        
            let isVisitDirExists = yield utility.fileExistCheck(visitDirPath);
            console.log("isVisitDirExists: ", isVisitDirExists);
            if (isVisitDirExists === false) {
                //create directory
                yield utility.mkdirp(visitDirPath);
            }
            var filePath = path.resolve('./EMCDocuments/' + visitDirName + '/' + file.originalname);
            fs.writeFileSync(filePath, file.buffer);
            let fileStat = yield utility.getFileStat(path.resolve(visitDirPath, file.originalname));
            var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, file.originalname, userid);
            patientVisitData.visitDocument = updatedVisitDocData;
            let savePatientVisitDocument = yield patientVisitData.save();
            console.log("savePatientVisitDocument---->", savePatientVisitDocument);
            return res.json({
                code: 200,
                message: constantmsg.fileUpdateSuccess,
                data: file.originalname
            });
        }
        else {
            return res.json(Response(500, "failed", constantmsg.internalError));
        }
    }).catch(function (err) {
        console.log(err, 'errrrrr');
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

function getFilePathFromId(documentId, patientVisitData) {
    var filePath = '';
    var documentName = '';
    var ext = '';
    if (patientVisitData.visitDocument) {
        for (var i = 0; i < patientVisitData.visitDocument.length; i++) {
            if (patientVisitData.visitDocument[i]._id == documentId) {
                documentName = patientVisitData.visitDocument[i].name;
                if (patientVisitData.visitDocument[i].ext && patientVisitData.visitDocument[i].ext !== '') {
                    ext = patientVisitData.visitDocument[i].ext;
                }
                break;
            }
        }
    }
    if (patientVisitData.patientId) {
        var visitDirName = utility.getDecryptText(patientVisitData.patientId.patientId) + '/' + patientVisitData._id;
        var visitDirPath = path.resolve('./EMCDocuments/', visitDirName);
        filePath = path.resolve(visitDirPath, documentName + ext);
    }
    return filePath;
}

function download(req, res) {
    co(function* () {
        var idInfo = req.params.id;
        var parts = idInfo.split('_');
        if (parts.length >= 2) {
            var documentId = parts[0];
            var visitId = parts[1];
            let patientVisitData = yield Visit.findById(visitId).populate('patientId').exec();
            var filePath = getFilePathFromId(documentId, patientVisitData);
            res.download(filePath);
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
};


/**
 * Function is use to get allergies list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-july-2017
 */
function viewVisitDocument(req, res) {
    co(function* () {
        var idInfo = req.params.id;
        var parts = idInfo.split('_');
        if (parts.length >= 2) {
            var documentId = parts[0];
            var visitId = parts[1];
            let patientVisitData = yield Visit.findById(visitId).populate('patientId').exec();
            var filePath = getFilePathFromId(documentId, patientVisitData);
            let data = yield utility.readFile(filePath);
            var base64 = data.toString('base64');
            res.send(base64);
        }
    }).catch(function (err) {
        console.log("err->", err);
        return res.json({ code: 402, message: err, data: {} });
    });
}


/**
 * Function is use update visit document data
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-May-2017
 */
function updateVisitDocData(visitDocuments, fileStat, docType, userId) {
    var fileSizeInKilobytes = Math.round(fileStat.size / 1024);
    if (visitDocuments) {
        var found = 0;
        for (var i = 0; i < visitDocuments.length; i++) {
            if (visitDocuments[i].name == docType) {
                visitDocuments[i].submittedBy = userId;
                visitDocuments[i].size = fileSizeInKilobytes;
                var current_time = moment();
                current_time = current_time.tz("Israel").format();
                current_time = moment(current_time);
                visitDocuments[i].createdAt = current_time;
                found = 1;
                break;
            }
        }
        if (found == 0) {
            var current_time = moment();
            current_time = current_time.tz("Israel").format();
            current_time = moment(current_time);
           
            visitDocuments.push({
                'submittedBy': userId,
                'size': fileSizeInKilobytes,
                'createdAt': current_time,
                'name': docType
            }
            )
        }
        return visitDocuments;
    }
}

/**
 * Function is use to get cities list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-july-2017
 */
function getCities(req, res) {
  co(function* () {
    let cities = yield Citi.find({}).exec();
    return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": cities });
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  });    
}

/**
 * Function is use to get patient dashboard count
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 12-July-2017
 */
function getPatientDashboardCount(req, res) {
    co(function* () {
        console.log("getPatientDashboardCount----> req.body:--->", req.body);
        var upperTimeLimit = '';
        var lowerTimeLimit = '';
        var utcMoment = moment.utc();
        console.log("getPatientDashboardCount----> utcMoment:--->", utcMoment);
        //Current hour
        if (req.body.timeRangeType == '1') {
            var lastOneHour = (moment.utc()).subtract(1, 'hour');
            lowerTimeLimit = lastOneHour;
            upperTimeLimit = utcMoment;
           // console.log("getPatientDashboardCount-----> lastOneHour:--->", lastOneHour);
        }
        //7 p.m till now
        // else if (req.body.timeRangeType == '2') {
        //     var sevenAm = moment(7, "HH");
        //     console.log("sevenAm--->", sevenAm);
        //     var shiftTime = moment(19, "HH");
        //     if( utcMoment > sevenAm && utcMoment <  shiftTime){
        //         var previousDay = (utcMoment).subtract(1, 'day');
        //         console.log("previousDay--->", previousDay);
        //         console.log("previousDay.get('date')--->", previousDay.get('date'));
        //         var lastDayShiftStartTime = moment(previousDay.get('date') + "19", "DD HH");
        //         console.log("lastDayShiftStartTime--->", lastDayShiftStartTime);
        //         lowerTimeLimit = lastDayShiftStartTime;
        //         var lastDayShiftEndTime = moment((moment.utc()).get('date') + "7", "DD HH");
        //         console.log("lastDayShiftEndTime--->", lastDayShiftEndTime);
        //         upperTimeLimit = lastDayShiftEndTime;
        //     }
        //     else{
        //        lowerTimeLimit = shiftTime;
        //        console.log("-----------------shiftTime--->", shiftTime);
        //        upperTimeLimit = utcMoment;
        //     }       
        // }
        //7 p.m till now
        else if (req.body.timeRangeType == '2') {
            var currentDaySevenAm = moment(7, "HH");
            var currentDaySevenPm = moment(19, "HH");
            var currentDayLastPm =  moment({hour: 23, minute: 59});
            console.log("currentDaySevenAm--->", currentDaySevenAm);
            console.log("currentDaySevenPm--->", currentDaySevenPm);
            console.log("currentDayLastPm--->", currentDayLastPm);
            console.log("moment(moment.utc()).isBefore(currentDayLastPm)->", moment(moment.utc()).isBefore(currentDayLastPm));
            console.log("moment(moment.utc()).isAfter(currentDaySevenPm)->", moment(moment.utc()).isAfter(currentDaySevenPm));
            if(utcMoment > currentDaySevenAm && utcMoment <  currentDaySevenPm){
                var previousDay = (moment.utc()).subtract(1, 'day');
                console.log("previousDay--->", previousDay);
                var lastDayShiftStartTime = moment(previousDay.get('date') + "19", "DD HH");
                console.log("lastDayShiftStartTime--->", lastDayShiftStartTime);
                lowerTimeLimit = lastDayShiftStartTime;
                var lastDayShiftEndTime = moment((moment.utc()).get('date') + "7", "DD HH");
                console.log("lastDayShiftEndTime--->", lastDayShiftEndTime);
                upperTimeLimit = lastDayShiftEndTime;
            }
            //7 PM to 11:59 pm
            else if(moment(moment.utc()).isBefore(currentDayLastPm) && moment(moment.utc()).isAfter(currentDaySevenPm)){
               lowerTimeLimit = currentDaySevenPm;
               upperTimeLimit = moment.utc();
            }
            else{
                var previousDay = (moment.utc()).subtract(1, 'day');
                console.log("previousDay--->", previousDay);
                var lastDayShiftStartTime = moment(previousDay.get('date') + "19", "DD HH");
                console.log("lastDayShiftStartTime--->", lastDayShiftStartTime);
                lowerTimeLimit = lastDayShiftStartTime;
                upperTimeLimit = moment.utc();
            }      
        }
        //From 7pm to 7AM of last day
        else if (req.body.timeRangeType == '3') {
             var sevenAm = moment(7, "HH");
             console.log("sevenAm--->", sevenAm);
             var shiftTime = moment(19, "HH");
             if( utcMoment > sevenAm && utcMoment <  shiftTime){
                var dayBeforeYesterday = (moment.utc()).subtract(2, 'day');
                console.log("dayBeforeYesterday--->", dayBeforeYesterday);
                console.log("dayBeforeYesterday.get('date')--->", dayBeforeYesterday.get('date'));
                var lastDayShiftStartTime = moment(dayBeforeYesterday.get('date') + "19", "DD HH");
                console.log("lastDayShiftStartTime--->", lastDayShiftStartTime);

                var previousDay = (moment.utc()).subtract(1, 'day');
                console.log("previousDay--->", previousDay);
                console.log("previousDay.get('date')--->", previousDay.get('date'));
                var lastDayShiftEndTime = moment(previousDay.get('date') + "7", "DD HH");
                console.log("lastDayShiftEndTime--->", lastDayShiftEndTime);
                lowerTimeLimit = lastDayShiftStartTime;
                upperTimeLimit = lastDayShiftEndTime;
            }
            else{
                var previousDay = (moment.utc()).subtract(1, 'day');
                console.log("previousDay--->", previousDay);
                console.log("previousDay.get('date')--->", previousDay.get('date'));
                var lastDayShiftStartTime = moment(previousDay.get('date') + "19", "DD HH");
                console.log("lastDayShiftStartTime--->", lastDayShiftStartTime);
                lowerTimeLimit = lastDayShiftStartTime;
                var lastDayShiftEndTime = moment((moment.utc()).get('date') + "7", "DD HH");
                console.log("lastDayShiftEndTime--->", lastDayShiftEndTime);
                upperTimeLimit = lastDayShiftEndTime;
            }
        }
        // choose dates range
        else if (req.body.timeRangeType == '4') {
            if (req.body.dateRange) {
                var date = req.body.dateRange.split("-");
                var start = new Date(date[0]);
                start.setDate(start.getDate() + 1);
                console.log('start', start);
                var end = new Date(date[1]);
                end.setDate(end.getDate() + 1);
                console.log('end', end);
                lowerTimeLimit = start;
                upperTimeLimit = end;
            }
        }
        console.log("--------------Final lowerTimeLimit--->", lowerTimeLimit);
        console.log("--------------Final upperTimeLimit--->", upperTimeLimit);

        var counts = yield {
            enteredEmc: Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 0, currentStatus: constantsObj.statusId.WAITING_FOR_NURSE }).count(),
            triageDone: Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 0, currentStatus: { $in: [constantsObj.statusId.AT_NURSE, constantsObj.statusId.WAITING_FOR_DOCTOR] } }).count(),
            drSaw: Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 0, currentStatus: { $in: [constantsObj.statusId.AT_DOCTOR, constantsObj.statusId.WAITING_FOR_CLOSURE, constantsObj.statusId.IN_TREATEMENT] } }).count(),
            treatmentDone: Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, $or: [{ visitIsClosed: 1 }, { currentStatus: { $in: [constantsObj.statusId.COMPLETED, constantsObj.statusId.COMPLETED_UNPAID] } }] }).count(),
            avgStartToTriageDone:
                    co(function* () {
                        let visitList = yield Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 0 }).exec();
                        console.log("visitList --->", visitList);
                        var diffTimeArrivedToTriageDone = [];
                        for (var i = 0; i < visitList.length; i++) {
                            console.log(" Visit list value for:  " + i + "------------>" + visitList[i]);
                            let stageData = yield VisitStage.findOne({ visitId: visitList[i]._id });
                            console.log("stageData for--->" + i + "----->" + stageData);
                            var mainstageData = stageData.mainStage;
                            var arrivedTime = '';
                            var traigeDoneTime = '';
                            for (var j = 0; j < mainstageData.length; j++) {
                                //arrived
                                if (mainstageData[j].name == constantsObj.statusId.ARRIVED) {
                                    if (mainstageData[j].createdAt) {
                                        arrivedTime = mainstageData[j].createdAt;
                                    }
                                }
                                //AT_NURSE
                                else if (mainstageData[j].name == constantsObj.statusId.AT_NURSE) {
                                    if (mainstageData[j].createdAt) {
                                        traigeDoneTime = mainstageData[j].createdAt;
                                    }
                                }
                            }
                            if (arrivedTime != '' && traigeDoneTime != '') {
                                console.log("arrivedTime:--->", arrivedTime);
                                console.log("traigeDoneTime:--->", traigeDoneTime);
                                var minuteDiff = moment(traigeDoneTime).diff(arrivedTime, 'minutes');
                                console.log("Diff:--->", minuteDiff);
                                diffTimeArrivedToTriageDone.push(minuteDiff);
                            }
                        }

                        var total = 0;
                        for (var i = 0; i < diffTimeArrivedToTriageDone.length; i++) {
                            total += diffTimeArrivedToTriageDone[i];
                        }
                        var avg = 0;
                        if (total > 0) {
                            avg = total / diffTimeArrivedToTriageDone.length;
                        }
                        return Math.round(avg);
                    }),
            avgNurseExamDoneToDrSaw:
                    co(function* () {
                        let visitList = yield Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 0 }).exec();
                        console.log("visitList --->", visitList);
                        var diffTimeTriageDoneToDrSaw = [];
                        for (var i = 0; i < visitList.length; i++) {
                            console.log(" Visit list value for:  " + i + "------------>" + visitList[i]);
                            let stageData = yield VisitStage.findOne({ visitId: visitList[i]._id });
                            console.log("stageData for--->" + i + "----->" + stageData);
                            var mainstageData = stageData.mainStage;
                            var WaitingForDoctorTime = '';
                            var AtDoctor = '';
                            for (var j = 0; j < mainstageData.length; j++) {
                                //WAITING_FOR_DOCTOR    
                                if (mainstageData[j].name == constantsObj.statusId.WAITING_FOR_DOCTOR) {
                                    if (mainstageData[j].createdAt) {
                                        WaitingForDoctorTime = mainstageData[j].createdAt;
                                    }
                                }
                                //AT_DOCTOR  AT_DOCTOR
                                else if (mainstageData[j].name == constantsObj.statusId.AT_DOCTOR) {
                                    if (mainstageData[j].createdAt) {
                                        AtDoctor = mainstageData[j].createdAt;
                                    }
                                }
                            }
                            if (WaitingForDoctorTime != '' && AtDoctor != '') {
                                console.log("WaitingForDoctorTime:--->", WaitingForDoctorTime);
                                console.log("AtDoctor:--->", AtDoctor);
                                var minuteDiff = moment(AtDoctor).diff(WaitingForDoctorTime, 'minutes');
                                console.log("Diff:--->", minuteDiff);
                                diffTimeTriageDoneToDrSaw.push(minuteDiff);
                            }
                        }

                        var total = 0;
                        for (var i = 0; i < diffTimeTriageDoneToDrSaw.length; i++) {
                            total += diffTimeTriageDoneToDrSaw[i];
                        }
                        var avg = 0;
                        if (total > 0) {
                            avg = total / diffTimeTriageDoneToDrSaw.length;
                        }
                        return  Math.round(avg);
                    }),
            avgTimeVisitStartToEnd:
                    co(function* () {
                       // let visitList = yield Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, visitIsClosed: 1 }).exec();
                     let visitList = yield Visit.find({ "updatedAt": { "$gte": lowerTimeLimit, "$lte": upperTimeLimit }, "visitEnd": {"$lte": upperTimeLimit}, visitIsClosed: 1 }).exec();
                        console.log("visitList --->", visitList);
                        var diffVisitStartToEnd = [];
                        for (var i = 0; i < visitList.length; i++) {
                            console.log(" Visit list value for:  " + i + "------------>" + visitList[i]);
                              var minuteDiff = moment(visitList[i].visitEnd).diff(moment(visitList[i].visitStart), 'minutes');
                            diffVisitStartToEnd.push(minuteDiff);
                        }
                        var total = 0;
                        console.log("diffVisitStartToEnd --->", diffVisitStartToEnd);
                        for (var i = 0; i < diffVisitStartToEnd.length; i++) {
                            total += diffVisitStartToEnd[i];
                        }
                          console.log("total --->", total);
                        var avg = 0;
                        if (total > 0) {
                            avg = total / diffVisitStartToEnd.length;
                        }
                         console.log("avg --->", avg);
                        return  Math.round(avg);
                    })
        };
        console.log(counts);
        return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": counts});
    }).catch(function (err) {
        console.log("err-->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get active Patient list by doctor
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 19-July-2017
 */
function getActivePatientListByDr(req, res) {
    co(function* () {
       let userInfo = yield utility.getUserInfoByToken(req.headers);

        let sort = utility.getSortObj(req.body);
        let count = parseInt(req.body.count ? req.body.count : 0);
        let skip = parseInt(req.body.count * (req.body.page - 1));
        var searchText = req.body.searchText;
          
        var condition = { visitIsClosed: 0, refferedTo: userInfo._id };
        if (searchText != undefined && searchText != 'undefined') {
           searchText = decodeURIComponent(searchText);
           searchText = (searchText).toLowerCase();
            condition.$or = [
                //{ 'visitStart': new RegExp(searchText, 'gi') },
                { 'visitDuration': new RegExp(searchText, 'gi') },
                { 'visitReason': new RegExp(searchText, 'gi') },
                { 'patientInfo.age': new RegExp(searchText, 'gi') },
                { 'patientInfo.firstname': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.lastname': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.patientId': new RegExp(utility.getEncryptText(searchText), 'gi') },
                { 'patientInfo.name': new RegExp(utility.getEncryptText(searchText), 'gi') },
            ];
        }
        let aggregate = [{
            $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patientInfo"
            }
        },
        { $unwind: "$patientInfo" },
        { $match: condition }, 
        {
            $project: {
                visitStart: 1,
                visitDuration: 1,
                visitReason: 1,
                currentStatus: 1,
                patientInfo: '$patientInfo'
            }
        }
        ];
        if (skip > 0) {
            aggregate.push({ $skip: skip });
        }
        if (count > 0) {
            aggregate.push({ $limit: count });
        }
        if (sort) {
            aggregate.push({ $sort: sort });
        }
        let activeVisits = yield Visit.aggregate(aggregate);
        if (activeVisits) {
            for (var i = 0; i < activeVisits.length; i++) {
                activeVisits[i].patientInfo.patientId = utility.getDecryptText(activeVisits[i].patientInfo.patientId);
                activeVisits[i].patientInfo.firstname = utility.getDecryptText(activeVisits[i].patientInfo.firstname);
                activeVisits[i].patientInfo.lastname = utility.getDecryptText(activeVisits[i].patientInfo.lastname);

                 var current_time = moment.utc();
                 var visitStart = moment(activeVisits[i].visitStart);
                 var diff = current_time.diff(visitStart);
                 var duration = moment.duration(diff);
                 var visitDuration = duration.format("DD hh:mm:ss");

                activeVisits[i].visitStart = visitStart.tz("Israel").format();
                activeVisits[i].visitDuration = visitDuration;
                let statusInfo = yield Status.findOne({ id: Number(activeVisits[i].currentStatus) }).lean().exec();
                activeVisits[i].statusColour = statusInfo.colour;
                activeVisits[i].statusName = statusInfo.name;
            }
        }
        var getCount = Visit.find(condition).count().exec();
        getCount.then(function (totalLength) {
            console.log("totalength:", totalLength);
            return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": activeVisits, "totalLength": totalLength });
        }).catch(function (err) {
            console.log("error:", err);
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
        });
    });
}
            