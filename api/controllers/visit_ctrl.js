'use strict';

var mongoose = require('mongoose'),
    Patient = mongoose.model('Patient'),
    Disease = mongoose.model('Disease'),
    User = mongoose.model('User'),
    Kupat = mongoose.model('Kupat'),
    Inventory = mongoose.model('Inventory'),
    Visit = mongoose.model('VisitInfo'),
    TriagePatientTest = mongoose.model('TriagePatientTest'),
    PatientTest = mongoose.model('PatientTest'),
    Order = mongoose.model('Order'),
    VisitStage = mongoose.model('VisitStage'),
    Triage = mongoose.model('Triage'),
    Alert = mongoose.model('Alert'),
    VisitSurvey = mongoose.model('VisitSurvey'),
    Survey = mongoose.model('Survey'),
    VisitPayment = mongoose.model('VisitPayment'),
    Status = mongoose.model('Status'),
    Allergy = mongoose.model('Allergy'),
    Setting = mongoose.model('Setting'),
    Response = require('../lib/response.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    validator = require('validator'),
    utility = require('../lib/utility.js'),
    async = require('async'),
    co = require('co'),
    moment = require('moment-timezone'),
    jsrender = require('node-jsrender'),
    pdf = require('html-pdf'),
    fs = require('fs'),
    path = require('path'),
    querystring = require('qs'),
    https = require('https'),
    _extRefTemplatePath = path.resolve('./api/lib/templates/medicalDoc/', 'external-referral.html'),
    _intRefTemplatePath = path.resolve('./api/lib/templates/medicalDoc/', 'internal refferal.html'),
    _treatmentSummaryTemplatePath = path.resolve('./api/lib/templates/medicalDoc/', 'treatment summary.html'),
    _prescriptionTemplatePath = path.resolve('./api/lib/templates/medicalDoc/', 'perscription.html');

module.exports = {
    addVisitReason: addVisitReason,
    addVisitDetails: addVisitDetails,
    addNurseExamination: addNurseExamination,
    addTriage: addTriage,
    addDoctorExamination: addDoctorExamination,
    addDoctorOrder: addDoctorOrder,
    addTreatmentResultDetails: addTreatmentResultDetails,
    addDoctorPrescription: addDoctorPrescription,
    getEMCPrescriptions: getEMCPrescriptions,
    addGivenDrugDetails: addGivenDrugDetails,
    getVisitById: getVisitById,
    addNewVisitReason: addNewVisitReason,
    getTriageTestByVisitId: getTriageTestByVisitId,
    getPatientVisitTest: getPatientVisitTest,
    getPrescriptions: getPrescriptions,
    issueDocument: issueDocument,
    getVisitDocumentInfoById: getVisitDocumentInfoById,
    closeVisitAndSendSurvey: closeVisitAndSendSurvey,
    getPatientVisitHistory: getPatientVisitHistory,
    getVisitHistory: getVisitHistory,
    visitbyId: visitbyId,
    //status
    updateStatus: updateStatus,
    getStageInfoById: getStageInfoById,
    //Drugs
    addPatientDrugs: addPatientDrugs,
    sendSummaryToFamilyDoctor: sendSummaryToFamilyDoctor,
    addVisitComment: addVisitComment,
    //Payment
    issueInvoice: issueInvoice,
    emailInvoice: emailInvoice,
    addPaymentDetails: addPaymentDetails,
    getPaymentDetailsByVisitId: getPaymentDetailsByVisitId,
    checkVisitPaymentDone: checkVisitPaymentDone,
    getPatientDebt: getPatientDebt,
    disableAlert: disableAlert,
    decrementPatientWaitCount: decrementPatientWaitCount,
    getAllergies: getAllergies,
    getdoc: getdoc,
    addDoctorTreatment:addDoctorTreatment
};

/**
 * Function is use to get visit by ID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-May-2017
 */
function getVisitById(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        console.log("getVisitById id:   ", id);
        let visitInfo = yield Visit.findById(id).populate('patientId').populate('currentDisease').populate('visitComment.submittedBy', "firstname lastname").lean().exec();
        let statusInfo = yield Status.findOne({ id: Number(visitInfo.currentStatus) }).lean().exec();
        visitInfo.currentStatus = statusInfo.name;
        let visitInfoWithKupatDetails = yield Visit.populate(visitInfo, {
            path: 'patientId.kupatCholim',
            model: 'Kupat'
        });
        let visitInfoWithFamilyDoctorDetails = yield Visit.populate(visitInfoWithKupatDetails, {
            path: 'patientId.familyDoctorId',
            model: 'User'
        });
        var fieldNotToDecrypt = ['_id', 'familyDoctorId', 'kupatCholim', 'comment', 'fatherName', 'email', 'motherName', 'age', 'status', 'DOB', 'fileName', 'allergies', 'medicalHistory', 'isPersonnel'];
        var patientObj = visitInfoWithFamilyDoctorDetails.patientId;
        utility.decryptedRecord(patientObj, fieldNotToDecrypt, function (patientRecord) {
            console.log("Decrypted getvisitbyId ", patientRecord);
            visitInfoWithFamilyDoctorDetails.patientId = patientRecord;
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": visitInfoWithFamilyDoctorDetails });
        })
    }).catch(function (err) {
        console.log("err:", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is add visit reason and create new visit object
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
function addVisitReason(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var current_time = moment();
        var visitStart = current_time.tz("Israel").format();
        //1.update Visit
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            patientVisitData.visitReason = req.body.visitReason;
            patientVisitData.isUrgent = req.body.isUrgent;
            let savedData = yield patientVisitData.save();
        }
        else {
            let savedData = yield new Visit({
                "patientId": req.body.patientId,
                "visitStart": visitStart,
                "visitReason": req.body.visitReason,
                "isUrgent": req.body.isUrgent,
            }).save();
        }
        //2. Make status of patient: 1 that is active
        let patientData = yield Patient.findById(req.body.patientId);
        if (patientData) {
            if (patientData.status == 0) {
                patientData.status = 1;
                let savedData = yield patientData.save();
            }
            return res.json(Response(200, "success", constantmsg.visitReasonSuccess));
        }
        else {
            return res.json(Response(402, "failed", constantmsg.visitDetailsUpdatedFailed, err));
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is add visit reason and create new visit object
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
function addNewVisitReason(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var current_time = moment.utc();
        let arrivedStatus = yield Status.findOne({ id: constantsObj.statusId.ARRIVED }).lean();
        let waitingNurseStatus = yield Status.findOne({ id: constantsObj.statusId.WAITING_FOR_NURSE }).lean();
        //var status = waitingNurseStatus.name;
        //1. update Visit
        let savedData = yield new Visit({
            "patientId": req.body.patientId,
            "visitStart": current_time,
            "visitReason": req.body.visitReason,
            "isUrgent": Number(req.body.isUrgent),
            "currentStatus": waitingNurseStatus.id
        }).save();
        console.log("savedData:", savedData);

       
        //2. Make status of patient: 1 that is active
        let patientData = yield Patient.findById(req.body.patientId);

        //Make entry in payment table for visit bill
        let visitInfo = yield Visit.findById(savedData._id).populate('patientId').lean().exec();
        let visitInfoWithKupatDetails = yield Visit.populate(visitInfo, {
            path: 'patientId.kupatCholim',
            model: 'Kupat'
        });
        var visitPrice = getVisitPriceByKupatAndCurrentDay(visitInfoWithKupatDetails);
        console.log("visitPrice--->", visitPrice);
        let savedPaymentData = yield new VisitPayment({
            "visitId": savedData._id,
            "billList": [{
                            visitPayment: visitPrice,
                            billableItems:[
                            ],
                            previousDebt: patientData.previousDebt,
                            currency: 'ILS'
                     }],     
        }).save();


        if (patientData) {
            if (patientData.status == 0) {
                patientData.status = 1;
                let savedData = yield patientData.save();
            }
            var stages = [];
            var mainStage = [];
            stages.push({
                name: 'visitReason',
                editedBy: userInfo._id,
                updatedAt: current_time,
                createdAt: current_time,
                isCompleted: 1
            });
            stages.push(
                {
                    name: 'identify',
                    editedBy: userInfo._id,
                    updatedAt: current_time,
                    createdAt: current_time,
                    isCompleted: 1
                });
            mainStage.push({
                name: waitingNurseStatus.id,
                editedBy: userInfo._id,
                updatedAt: current_time,
                createdAt: current_time,
            });
            mainStage.push({
                name: arrivedStatus.id,
                editedBy: userInfo._id,
                updatedAt: current_time,
                createdAt: current_time,
            });
            let savedStageData = yield new VisitStage({
                "visitId": savedData._id,
                "stages": stages,
                "mainStage": mainStage
            }).save();
            return res.json({ 'code': 200, status: "success", 'message': constantmsg.visitReasonSuccess, 'data': savedData });
        }
        else {
            return res.json(Response(402, "failed", constantmsg.visitDetailsUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is add visit details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
function addVisitDetails(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body._id).populate('patientId');
        if (patientVisitData) {
            if (patientVisitData.isUrgent != req.body.isUrgent) {
                patientVisitData.isUrgent = req.body.isUrgent;
            }
            patientVisitData.mainComplaint = req.body.mainComplaint;
            patientVisitData.medicalHistory = req.body.medicalHistory;
            var isModifiedTest = equalArray(req.body.currentDisease, patientVisitData.currentDisease);
            var oldDiseaseIds = patientVisitData.currentDisease;
            patientVisitData.currentDisease = req.body.currentDisease;
            patientVisitData.nurseComments = req.body.nurseComments;
            patientVisitData.drugTakes = req.body.drugTakes;
            let savedData = yield patientVisitData.save();

            //save nurse and doctor test in patienttest table
            if (isModifiedTest == false) {
                //check disease index
                //  console.log("oldDiseaseIds:", oldDiseaseIds);

                var diseaseIdToBeCheck = [];
                var newDiseaseIds = req.body.currentDisease;
                // console.log("newDiseaseIds: ", newDiseaseIds);

                for (var i = 0; i < newDiseaseIds.length; i++) {
                    var found = 0;
                    for (var j = 0; j < oldDiseaseIds.length; j++) {
                        if (newDiseaseIds[i] == oldDiseaseIds[j]) {
                            found = 1;
                            break;
                        }
                    }
                    if (found == 0) {
                        diseaseIdToBeCheck.push(newDiseaseIds[i]);
                    }
                }
                // console.log("diseaseIdToBeCheck: ", diseaseIdToBeCheck);
                //Dismiss previous alerts for visit
                if (diseaseIdToBeCheck.length > 0) {
                    let previousAlerts = yield Alert.find({ visitId: req.body._id, alertType: 'Disease', status: 1 }).exec();
                    if (previousAlerts && previousAlerts.length > 0) {
                        for (var i = 0; i < previousAlerts.length; i++) {
                            previousAlerts[i].status = 0;
                            let savedData = yield previousAlerts[i].save();
                        }
                    }
                }
                var alertData = {
                    diseases: []
                };
                for (var i = 0; i < diseaseIdToBeCheck.length; i++) {
                    var diseaseData = yield Disease.findById(diseaseIdToBeCheck[i]);
                    // console.log();
                    if (diseaseData.alertFreqency > 0) {
                        alertData.diseases.push({
                            name: diseaseData.name,
                            alertInterval: diseaseData.alertFreqency
                        });
                    }
                }
                if (diseaseIdToBeCheck.length > 0) {
                    alertData.visitId = req.body._id;
                    alertData.patientInfo = {
                        name: utility.getDecryptText(patientVisitData.patientId.firstname) + " " + utility.getDecryptText(patientVisitData.patientId.lastname),
                        age: patientVisitData.patientId.age,
                        gender: utility.getDecryptText(patientVisitData.patientId.gender),
                        allergies: patientVisitData.patientId.allergies
                    }
                    let savedAlertData = yield new Alert({
                        "visitId": req.body._id,
                        "alertType": "Disease",
                        "diseases": alertData.diseases,
                    }).save();
                    alertData.alertId = savedAlertData._id;
                    console.log("alertData: ", alertData);
                }
                var diseaseIds = savedData.currentDisease;
                var nurseTest = [];
                var doctorTest = [];
                for (var i = 0; i < diseaseIds.length; i++) {
                    var diseaseData = yield Disease.findById(diseaseIds[i]);
                    if (diseaseData) {
                        if (diseaseData.nurseTest) {
                            for (var j = 0; j < diseaseData.nurseTest.length; j++) {
                                nurseTest.push({ name: diseaseData.nurseTest[j].nurseTest, comment: '', diseaseId: diseaseIds[i] });
                            }
                        }
                        if (diseaseData.doctorTest) {
                            for (var j = 0; j < diseaseData.doctorTest.length; j++) {
                                doctorTest.push({ name: diseaseData.doctorTest[j].doctorTest, comment: '', diseaseId: diseaseIds[i] });
                            }
                        }
                    }
                }

                let testData = yield PatientTest.findOne({ visitId: req.body._id });
                if (testData) {
                    testData.nurseTest = nurseTest;
                    testData.doctorTest = doctorTest;
                    let testsavedData = yield testData.save();
                }
                else {
                    let testsavedData = yield new PatientTest({
                        "visitId": req.body._id,
                        "nurseTest": nurseTest,
                        "doctorTest": doctorTest
                    }).save();
                }
            }
            //TODO: Check index for disease
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'nurse_visitDetails', '', userInfo._id);
            if (stageInfo) {
                stageData.stages = stageInfo.stages;
                let stageDataSaved = yield stageData.save();
            }

            return res.json(Response(200, "success", constantmsg.visitDetailsUpdatedSuccess, alertData));
        } else {
            return res.json(Response(402, "failed", constantmsg.visitDetailsUpdatedFailed, err));
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}




/**
 * Function is  to check array equal 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
//TODO: Move to utility
function equalArray(a, b) {
    if (a.length === b.length) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}


/**
 * Function is add nurse examination details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
function addNurseExamination(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        var previousRefferedToId = patientVisitData.refferedTo;
        console.log("previousRefferedToId--->", previousRefferedToId);
        console.log("new RefferedToId--->", req.body.refferedTo);

        if (patientVisitData) {
            let waitingDrStatus = yield Status.findOne({ id: constantsObj.statusId.WAITING_FOR_DOCTOR }).lean();
            patientVisitData.refferedTo = req.body.refferedTo;
            patientVisitData.currentStatus = waitingDrStatus.id;
            let savedVisitData = yield patientVisitData.save();
            let doctorInfo = yield User.findOne({ _id: req.body.refferedTo });
            console.log('doctorInfo-->', doctorInfo);
            if (!previousRefferedToId) {
                  console.log("1");
                if (doctorInfo) {
                    if (doctorInfo.patientWaitingCount) {
                        doctorInfo.patientWaitingCount = doctorInfo.patientWaitingCount + 1;
                    }
                    else {
                        doctorInfo.patientWaitingCount = 1;
                    }
                    let doctorUpdatedData = yield doctorInfo.save();
                }
            }
            else if (previousRefferedToId && (previousRefferedToId !== req.body.refferedTo)) {
                  console.log("2");
                if (doctorInfo) {
                    if (doctorInfo.patientWaitingCount) {
                        doctorInfo.patientWaitingCount = doctorInfo.patientWaitingCount + 1;
                    }
                    else {
                        doctorInfo.patientWaitingCount = 1;
                    }
                    let doctorUpdatedData = yield doctorInfo.save();
                }
                let previousDoctorInfo = yield User.findOne({ _id: previousRefferedToId });
                 console.log("before previousDoctorInfo--->", previousDoctorInfo.patientWaitingCount);
                if (previousDoctorInfo) {
                    if (previousDoctorInfo.patientWaitingCount) {
                        previousDoctorInfo.patientWaitingCount = previousDoctorInfo.patientWaitingCount - 1;
                        let doctorUpdatedData = yield previousDoctorInfo.save();
                        console.log("after previousDoctorInfo--->", previousDoctorInfo.patientWaitingCount);
                    }
                }
            }
            //  console.log('savedVisitData-->', savedVisitData);
            let testData = yield PatientTest.findOne({ visitId: req.body.visitId });
            if (testData) {
                testData.nurseTest = req.body.nurseTest;
                let testsavedData = yield testData.save();
            }
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'nurse_exam', waitingDrStatus.id, userInfo._id);
            stageData.mainStage = stageInfo.mainStage;
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.nurseExaminationSavedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.nurseExaminationSavedFailed, err));
        }
    }).catch(function (err) {
        console.log('addNurseExamination err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is tirage details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addTriage(req, res) {
    // console.log('----------------addtriage----------', req.body);
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        var newTriageData = req.body.triageTest;
        //add test taken by property in each new triage test
        newTriageData.forEach(function (obj) { obj.testTakenBy = userInfo._id; });

        console.log("newTriageData", newTriageData);
        if (patientVisitData) {
            let patientData = yield Patient.findById(patientVisitData.patientId);
            if (patientData) {
                patientData.allergies = req.body.allergies;
                let savedPatientData = yield patientData.save();
            }

            //check if allergies present in db if not add else skip
            var allergiesToAdd = [];
            let allergiesInfo = yield Allergy.find().exec();
            var newAllergies = req.body.allergies
            for (var i = 0; i < newAllergies.length; i++) {
                var found = 0;
                for (var j = 0; j < allergiesInfo.length; j++) {
                    if (newAllergies[i] == allergiesInfo[j].name) {
                        found = 1;
                        break;
                    }
                }
                if (found == 0) {
                    allergiesToAdd.push(newAllergies[i]);
                }
            }

            for (var i = 0; i < allergiesToAdd.length; i++) {
                let savedAllergyData = yield new Allergy({
                    "name": allergiesToAdd[i],
                }).save();
            }


            patientVisitData.allergies = req.body.allergies;
            let savedVisitData = yield patientVisitData.save();
            let indexLookup = yield Triage.find();

            //Dismiss previous alerts for visit
            if (newTriageData && newTriageData.length > 0) {
                let previousAlerts = yield Alert.find({ visitId: req.body.visitId, status: 1 }).exec();
                if (previousAlerts && previousAlerts.length > 0) {
                    for (var i = 0; i < previousAlerts.length; i++) {
                        previousAlerts[i].status = 0;
                        let savedData = yield previousAlerts[i].save();
                    }
                }
            }
            //Check if new alert for triage data
            var alertInfo = {};
            if (newTriageData && newTriageData.length > 0) {
                alertInfo = yield checkTriageIndex(newTriageData, indexLookup);
                if (alertInfo && alertInfo.triages && alertInfo.triages.length > 0) {
                    alertInfo.visitId = req.body.visitId;
                    alertInfo.patientInfo = {
                        name: utility.getDecryptText(patientData.firstname) + " " + utility.getDecryptText(patientData.lastname),
                        age: patientData.age,
                        gender: utility.getDecryptText(patientData.gender),
                        allergies: patientData.allergies
                    }
                    let savedAlertData = yield new Alert({
                        "visitId": req.body.visitId,
                        "alertType": "Triage",
                        "triages": alertInfo.triages,
                    }).save();
                    alertInfo.alertId = savedAlertData._id;
                    console.log('alertInfo TRIAGE:---->', alertInfo);
                    console.log('savedAlertData TRIAGE:---->', savedAlertData);
                }
            }
            let triageData = yield TriagePatientTest.findOne({ visitId: req.body.visitId });
            if (triageData) {
                for (var i = 0; i < newTriageData.length; i++) {
                    triageData.triageTest.push(newTriageData[i]);
                }
                let savedTriageData = yield triageData.save();
            }
            else {
                //Save patient test data in patientTest table
                let savedTriageTestData = yield new TriagePatientTest({
                    "visitId": req.body.visitId,
                    "triageTest": newTriageData,
                }).save();
            }
            //update stage info
            // let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            // var stageInfo = updateStageInfo(stageData, 'nurse_triage', '', userInfo._id);
            // stageData.stages = stageInfo.stages;
            // let stageDataSaved = yield stageData.save();
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'nurse_visitDetails', '', userInfo._id);
            if (stageInfo) {
                stageData.stages = stageInfo.stages;
                let stageDataSaved = yield stageData.save();
            }

            return res.json(Response(200, "success", constantmsg.triageTestSavedSuccess, { alertInfo }));
        } else {
            return res.json(Response(402, "failed", constantmsg.triageTestSavedFailed, err));
        }
    }).catch(function (err) {
        console.log('error:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function to check triage index for test
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 09-June-2017
 */
function checkTriageIndex(newTestData, indexLookup) {
    console.log('checkTriageIndex');
    // console.log("indexLookup", indexLookup);
    var outputData = {
        triages: []
    };
    var current_time = moment();
    current_time = current_time.tz("Israel").format();
    return new Promise(function (resolve, reject) {
        console.log("newTestData", newTestData);
        for (var i = 0; i < newTestData.length; i++) {
            if (newTestData[i]) {
                var testData = newTestData[i];
                for (var item in testData) {
                    console.log("-------checking for value------- " + testData[item] + " is Key#" + item);
                    //Check if item is Bloodpressure
                    if (item == 'bloodPressure') {
                        for (var i = 0; i < indexLookup.length; i++) {
                            console.log("indexLookup:" + i + "value:---->", indexLookup[i]);
                            if ((indexLookup[i].key) == 'Sysbp') {
                                if ((testData[item].minValue < indexLookup[i].minRange) || (testData[item].minValue > indexLookup[i].maxRange)) {
                                    outputData.triages.push({
                                        name: 'Systolic Blood Pressure',
                                        value: testData[item].minValue,
                                        alertInterval: indexLookup[i].alertFreqency,
                                        time: current_time
                                    });
                                    console.log("outputData: Systolic ", outputData);
                                }
                            }
                            if ((indexLookup[i].key) == 'Diabp') {
                                if ((testData[item].maxValue < indexLookup[i].minRange) || (testData[item].maxValue > indexLookup[i].maxRange)) {
                                    outputData.triages.push({
                                        name: 'Diastolic Blood Pressure',
                                        value:  testData[item].maxValue,
                                        alertInterval: indexLookup[i].alertFreqency,
                                        time: current_time
                                    });
                                    console.log("outputData: Diastolic ", outputData);
                                }
                            }
                            if ((indexLookup[i].key) == 'pulsebp') {
                                if (((testData[item].minValue - testData[item].maxValue) < indexLookup[i].minRange) || ((testData[item].minValue - testData[item].maxValue) > indexLookup[i].maxRange)) {
                                    var pulsePressure =  testData[item].minValue - testData[item].maxValue;
                                    outputData.triages.push({
                                        name: 'Pulse Pressure',
                                        value: pulsePressure,
                                        alertInterval: indexLookup[i].alertFreqency,
                                        time: current_time
                                    });
                                    console.log("outputData: pulsebp ", outputData);
                                }
                            }
                        }
                    }
                    else {
                        for (var i = 0; i < indexLookup.length; i++) {
                            console.log("indexLookup:" + i + "value:---->", indexLookup[i]);
                            if ((indexLookup[i].key) == item) {
                                if ((testData[item] < indexLookup[i].minRange) || (testData[item] > indexLookup[i].maxRange)) {
                                    outputData.triages.push({
                                        name: item,
                                        value: testData[item],
                                        alertInterval: indexLookup[i].alertFreqency,
                                        time: current_time
                                    });
                                    console.log("outputData:  ", outputData);
                                }
                                break;
                            }
                        }
                    }

                }
            }
            console.log("outputData: from checkTriageIndex", outputData);
            resolve(outputData);
        }
    });
}

/**
 * Function is disable alert for visit if present
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 13-June-2017
 */
function disableAlert(req, res) {
    console.log("-----------------disableAlert----------------------------");
    co(function* () {
        let previousAlerts = yield Alert.find({ visitId: req.body.visitId, status: 1 }).exec();
        if (previousAlerts && previousAlerts.length > 0) {
            for (var i = 0; i < previousAlerts.length; i++) {
                previousAlerts[i].status = 0;
                let savedData = yield previousAlerts[i].save();
                console.log("savedData: disableAlert ---->", savedData);
            }
        }
        return res.json(Response(200, "success"));
    }).catch(function (err) {
        console.log("disableAlert:", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
};

/**
 * Function is doctor nurse examination details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addDoctorExamination(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            // console.log('req.body.phyExam', req.body.phyExam);
            patientVisitData.phyExam = req.body.phyExam;
            patientVisitData.currentdisease = req.body.currentdisease;
            let savedVisitData = yield patientVisitData.save();
            //  console.log('savedVisitData', savedVisitData);
            let patientTestData = yield PatientTest.findOne({ visitId: req.body.visitId });
            if (patientTestData) {
                patientTestData.doctorTestTakenBy = req.body.id;
                patientTestData.doctorTest = req.body.doctorTest;
                let savedPatientTestData = yield patientTestData.save();
            }
            else {
                let savedPatientTestData = yield new PatientTest({
                    "visitId": req.body.visitId,
                    "doctorTestTakenBy": req.body.id,
                    "doctorTest": req.body.doctorTest,
                }).save();
            }
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'dr_exam', '', userInfo._id);
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.doctorExaminationSavedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.doctorExaminationSavedFailed, err));
        }
    }).catch(function (err) {
        console.log('addDoctorExamination err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is treatment details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addDoctorOrder(req, res) {
    //  console.log('treatmentDetails:',req.body);
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            if (req.body.internalRefferal != '') {
                patientVisitData.internalRefferal = req.body.internalRefferal;
            }
            patientVisitData.course = req.body.course;
            patientVisitData.diagonosis = req.body.diagonosis;
            patientVisitData.internalReferralComments = req.body.internalReferralComments;
            let inTreatmentStatus = yield Status.findOne({ id: constantsObj.statusId.IN_TREATEMENT }).lean();
            var mainStage = '';
            if (patientVisitData.internalRefferal && patientVisitData.internalRefferal.length > 0) {
                patientVisitData.currentStatus = inTreatmentStatus.id;
                mainStage = inTreatmentStatus.id;
            }
            let savedData = yield patientVisitData.save();
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'doctor_Order', mainStage, userInfo._id);
            stageData.mainStage = stageInfo.mainStage;
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.treatmentDetailsUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.treatmentDetailsUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addDoctorOrder err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is treatment details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addTreatmentResultDetails(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            patientVisitData.drfollowup = req.body.drfollowup;
            patientVisitData.treatmentResultComment = req.body.treatmentResultComment;
            patientVisitData.goToERIf = req.body.goToERIf;
            patientVisitData.treatmentResultType = req.body.treatmentResultType;
            if (req.body.treatmentResultType === 'External Referral') {
                patientVisitData.externalRefferedTo = req.body.externalRefferedTo;
                patientVisitData.refferedBy = req.body.refferedBy;
            }
            patientVisitData.doctorResultCommentOrOrder = req.body.doctorResultCommentOrOrder;
            let savedData = yield patientVisitData.save();
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'dr_result', '', userInfo._id);
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.treatmentResultUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.treatmentResultUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addTreatmentResultDetails err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is doctor prescription for visit
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addDoctorPrescription(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        let waitingClosureStatus = yield Status.findOne({ id: constantsObj.statusId.WAITING_FOR_CLOSURE }).lean();
        patientVisitData.currentStatus = waitingClosureStatus.id;
        let savedPatientVisitData = yield patientVisitData.save();
        if (patientVisitData) {
            let prescriptionData = yield Order.findOne({ visitId: req.body.visitId });
            if (prescriptionData) {
                prescriptionData.emcOrder = req.body.emcOrder;
                prescriptionData.extOrder = req.body.extOrder;
                let savedPrescriptionData = yield prescriptionData.save();
            }
            else {
                let savedPrescriptionData = yield new Order({
                    "visitId": req.body.visitId,
                    "emcOrder": req.body.emcOrder,
                    "extOrder": req.body.extOrder
                }).save();
            }
            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'dr_prescriptions', waitingClosureStatus.id, userInfo._id);
            if (stageInfo && stageInfo.mainStage && stageInfo.stages) {
                stageData.mainStage = stageInfo.mainStage;
                stageData.stages = stageInfo.stages;
                let stageDataSaved = yield stageData.save();
            }
            return res.json(Response(200, "success", constantmsg.orderUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.orderUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addDoctorPrescription err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get EMC Prescriptions
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function getEMCPrescriptions(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let emcOrdersList = yield Order.find({ orderType: 'EMC', visitId: id }).exec();
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": emcOrdersList });
    }).catch(function (err) {
        console.log('getEMCPrescriptions err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get  Prescriptions
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 15-May-2017
 */
function getPrescriptions(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let ordersList = yield Order.findOne({ visitId: id }).exec();
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": ordersList });
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}



/**
 * Function is to save given drugs details
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addGivenDrugDetails(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            var orderGivenList = req.body.orderGivenList;
            for (var i = 0; i < orderGivenList.length; i++) {
                let orderData = yield Order.findById(orderGivenList[i].orderId);
                if (orderData) {
                    orderData.given = orderGivenList[i].given;
                    orderData.givenAmount = orderGivenList[i].givenAmount;
                    orderData.orderGivenBy = orderGivenList[i].userId;
                    let savedData = yield orderData.save();
                    //TODO
                    //1. Decrement drug detail from inventory
                }
                else {
                    return res.json(Response(402, "failed", constantmsg.orderUpdatedFailed, err));
                }
            }
            return res.json(Response(200, "success", constantmsg.orderUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.orderUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addGivenDrugDetails err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}


/**
 * Function is use to get triage test by visitID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 09-May-2017
 */
function getTriageTestByVisitId(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let triageInfo = yield TriagePatientTest.findOne({ visitId: id }).populate('triageTest.testTakenBy', 'firstname lastname').exec();
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": triageInfo });
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get patient test by visitID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 10-May-2017
 */
function getPatientVisitTest(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let patientTestInfo = yield PatientTest.findOne({ visitId: id }).exec();
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": patientTestInfo });
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to gather data and issue document
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-May-2017
 */
function issueDocument(req, res) {
    console.log('---issueDocument---');
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
        var docType = req.body.docType;
        let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId').populate('currentDisease').exec();
        console.log('patientVisitData----->', patientVisitData);
        let patientData = yield Patient.findById(patientVisitData.patientId).populate('kupatCholim').exec();
        var visitDirName = utility.getDecryptText(patientVisitData.patientId.patientId) + '/' + patientVisitData._id;
        var visitDirPath = path.resolve('./EMCDocuments/', visitDirName)
        //create directory for visit if not created        
        let isVisitDirExists = yield utility.fileExistCheck(visitDirPath);
        console.log("isVisitDirExists: ", isVisitDirExists);
        if (isVisitDirExists === false) {
            //create directory
            yield utility.mkdirp(visitDirPath);
        }

        if (patientVisitData) {

            //Get Issue Time
            var current_time = moment.utc();
            var currentTimeMomentObj = moment(current_time).tz("Israel").format();
            var currentTimeMomentString = moment(currentTimeMomentObj).format('DD/MM/YYYY hh:mm'); // 2016-07-15
            console.log('currentTimeMomentString: ', currentTimeMomentString);

            //Get Age
            var ageNumber = '';
            var ageUnit = '';

            if (patientVisitData.patientId.age) {
                ageNumber = (patientVisitData.patientId.age.year == 0) ? (patientVisitData.patientId.age.month == 0) ? patientVisitData.patientId.age.day : patientVisitData.patientId.age.month : patientVisitData.patientId.age.year;
                console.log("ageNumber:  ---->", ageNumber);
                ageUnit = (patientVisitData.patientId.age.year == 0) ? (patientVisitData.patientId.age.month == 0) ? 'Day' : 'Month' : 'Year';
                console.log("ageUnit:  ---->", ageUnit);
            }
            var age = ageNumber + ' ' + ageUnit;
            console.log("patientVisitData.patientId.age:  ---->", patientVisitData.patientId.age);
            console.log("patientVisitData.patientId.age:  ---->", age);


            //Get HMO
            var hmo = '';
            if (patientData.kupatCholim && patientData.kupatCholim.name) {
                hmo = patientData.kupatCholim.name;
            }
            if (docType == constantsObj.docType.EXT_REFERRAL || docType == constantsObj.docType.INT_REFERRAL || docType == constantsObj.docType.TREATMENT_SUMMARY) {
                let triageInfo = yield TriagePatientTest.findOne({ visitId: req.body.visitId }).exec();
                let patientTestInfo = yield PatientTest.findOne({ visitId: req.body.visitId }).exec();
                console.log('triageInfo--->', triageInfo);
                console.log('patientTestInfo-->', patientTestInfo);

                //currentDisease
                var currentDisease = [];
                if (patientVisitData.currentDisease) {
                    for (var i = 0; i < patientVisitData.currentDisease.length; i++) {
                        currentDisease.push(patientVisitData.currentDisease[i].name);
                    }
                    currentDisease = currentDisease.join(' ,');
                }
                console.log('currentDisease-->', currentDisease);

                var triageTest = {
                    "pulse": "",
                    "temp": "",
                    "satu": "",
                    "bp": "",
                    "breadth": ""
                };
                console.log('triageTest--->', triageTest);
                if (triageInfo && triageInfo.triageTest && triageInfo.triageTest.length > 0) {
                    var test = triageInfo.triageTest[triageInfo.triageTest.length - 1];
                    triageTest.pulse = test.pulse;
                    triageTest.temp = test.temperature;
                    triageTest.satu = test.saturation;
                    triageTest.bp = test.bloodPressure.maxValue + '/' + test.bloodPressure.minValue;
                    triageTest.breadth = test.breadthPerMinute;
                }
                console.log('triageTest--->', triageTest);


                //Translation part
                var documentValues = {
                    patientName: utility.getDecryptText(patientVisitData.patientId.firstname) + " " + utility.getDecryptText(patientVisitData.patientId.lastname),
                    address: utility.getDecryptText(patientVisitData.patientId.address),
                    hmo: hmo,
                    mainComplaint: patientVisitData.mainComplaint,
                    currentDisease: currentDisease,
                    bgcomplaint: patientVisitData.medicalHistory,
                    allergies: (patientVisitData.patientId.allergies).join(' ,'),
                    diagonosis: patientVisitData.diagonosis,
                    course: patientVisitData.course,
                    drFollowUp: patientVisitData.drfollowup,
                    treatment: patientVisitData.treatmentResultType,
                    goToERIf: patientVisitData.goToERIf,
                    drName: userInfo.firstname + ' ' + userInfo.lastname,
                    externalRefferedTo: patientVisitData.externalRefferedTo,
                    drugTakes: patientVisitData.drugTakes
                }
                console.log('documentValues --->', documentValues);

                documentValues = utility.replaceUndefinedObjValToNull(documentValues);

                console.log('patientVisitData.phyExam-->', patientVisitData.phyExam);


                var dateString = patientVisitData.visitStart;
                console.log('dateString: ', dateString);
                var dateObj = new Date(dateString);
                console.log('dateObj: ', dateObj);
                var momentObj = moment(dateObj);
                var momentString = momentObj.format('DD/MM/YYYY hh:mm'); // 2016-07-15
                console.log('momentString: ', momentString);
                var templateKeyValue = {};

                //  var current_time = moment();
                // current_time = current_time.tz("Israel").format();


                templateKeyValue[constantsObj.templateTag.PRINTING_TIME] = currentTimeMomentString;
                templateKeyValue[constantsObj.templateTag.NAME] = documentValues.patientName;
                templateKeyValue[constantsObj.templateTag.ID] = utility.getDecryptText(patientVisitData.patientId.patientId);
                templateKeyValue[constantsObj.templateTag.HM] = documentValues.hmo;
                templateKeyValue[constantsObj.templateTag.ADDRESS] = documentValues.address;
                templateKeyValue[constantsObj.templateTag.PHONE] = utility.getDecryptText(patientVisitData.patientId.mobileNo);
                templateKeyValue[constantsObj.templateTag.AGE] = age;
                templateKeyValue[constantsObj.templateTag.TREATMENT_DATE] = momentString;

                templateKeyValue[constantsObj.templateTag.PULSE] = triageTest.pulse;
                templateKeyValue[constantsObj.templateTag.TEMP] = triageTest.temp;
                templateKeyValue[constantsObj.templateTag.SATU] = triageTest.satu;
                templateKeyValue[constantsObj.templateTag.BP] = triageTest.bp;
                templateKeyValue[constantsObj.templateTag.BREADTH] = triageTest.breadth;


                templateKeyValue[constantsObj.templateTag.MAIN_COMPLAINT] = documentValues.mainComplaint;
                templateKeyValue[constantsObj.templateTag.CURRENT_DISEASE] = documentValues.currentDisease;
                templateKeyValue[constantsObj.templateTag.MEDICAL_HISTORY] = documentValues.bgcomplaint;
                templateKeyValue[constantsObj.templateTag.ALLERGIES] = documentValues.allergies;
                templateKeyValue[constantsObj.templateTag.DIAGONSIS] = documentValues.diagonosis;
                templateKeyValue[constantsObj.templateTag.DR_FOLLLOWUP] = documentValues.drFollowUp;
                templateKeyValue[constantsObj.templateTag.COURSE] = documentValues.course;
                templateKeyValue[constantsObj.templateTag.TREATMENT] = documentValues.treatment;
                templateKeyValue[constantsObj.templateTag.GOTO_ERIF] = documentValues.goToERIf;
                templateKeyValue[constantsObj.templateTag.DR_NAME] = documentValues.drName;
                templateKeyValue[constantsObj.templateTag.EXTERNAL_REFERTO] = documentValues.externalRefferedTo;
                templateKeyValue[constantsObj.templateTag.PHY_EXAM] = patientVisitData.phyExam;
                templateKeyValue[constantsObj.templateTag.DRUG_TAKES] = documentValues.drugTakes;

                //Generate document on basis of documenttype
                if (docType == constantsObj.docType.EXT_REFERRAL) {
                    console.log("docType--->", docType);
                    var generatedDocPath = path.resolve(visitDirPath, docType + '.pdf');
                    console.log("generatedDocPath--->", generatedDocPath);
                    let isPdfGenerated = yield generateReferralDocument(_extRefTemplatePath, generatedDocPath, templateKeyValue);
                    console.log("isPdfGenerated------->", isPdfGenerated);
                    if (isPdfGenerated) {
                        var files = [];
                        let fileStat = yield utility.getFileStat(generatedDocPath);
                        var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, docType, userInfo._id);
                        console.log("updatedVisitDocData: ", updatedVisitDocData);
                        patientVisitData.visitDocument = updatedVisitDocData;
                        let savePatientVisitDocument = yield patientVisitData.save();
                        var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + docType + '.pdf';
                        console.log("Response Pdf---->", filename);
                        files.push(filename);
                        console.log("files Pdf---->", files);
                        return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                    }
                    else {
                        return res.json(Response(402, "failed", constantmsg.docuementCreatedFailed));
                    }
                }
                // else if (docType == constantsObj.docType.INT_REFERRAL) {
                //     var list = patientVisitData.internalRefferal;
                //     var files = [];
                //     console.log("files Pdf---->", files);
                //     var count = 0;
                //     for (var i = 0; i < list.length; i++) {
                //         var item = list[i];
                //         count += 1;
                //         console.log("Count--->", count);
                //         templateKeyValue[constantsObj.templateTag.REFERTO] = utility.translateIntRefToHebrew(item.type);
                //         var intDocType = docType + '_' + item.type;
                //         var generatedDocPath = path.resolve(visitDirPath, intDocType + '.pdf');
                //         console.log("generatedDocPath--->", generatedDocPath);
                //         let isPdfGenerated = yield generateReferralDocument(_intRefTemplatePath, generatedDocPath, templateKeyValue);
                //         console.log("isPdfGenerated------->", isPdfGenerated);

                //         if (isPdfGenerated) {
                //             let fileStat = yield utility.getFileStat(generatedDocPath);
                //             var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, intDocType, userInfo._id);
                //             // console.log("updatedVisitDocData: ", updatedVisitDocData);
                //             patientVisitData.visitDocument = updatedVisitDocData;
                //             let savePatientVisitDocument = yield patientVisitData.save();
                //             var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + intDocType + '.pdf';
                //             console.log("filename Pdf---->", filename);
                //             files.push(filename);
                //             console.log("files Pdf---->", files);
                //             if (count == list.length) {
                //                 console.log("before dreturn files Pdf---->", files);
                //                 return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                //             }
                //             //return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.docuementCreatedSuccess });
                //         }
                //         else {
                //             return res.json(Response(402, "failed", constantmsg.docuementCreatedFailed));
                //         }
                //     }
                // }
                else if (docType == constantsObj.docType.INT_REFERRAL) {
                    var list = patientVisitData.internalRefferal;
                    var files = [];
                    console.log("files Pdf---->", files);
                    var count = 0;
                    var otherTests = [];
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        count += 1;
                        if (item.type == 'XRAY') {
                            templateKeyValue[constantsObj.templateTag.REFERTO] = utility.translateIntRefToHebrew(item.type);
                            var intDocType = docType + '_' + item.type;
                            var generatedDocPath = path.resolve(visitDirPath, intDocType + '.pdf');
                            let isPdfGenerated = yield generateReferralDocument(_intRefTemplatePath, generatedDocPath, templateKeyValue);
                            if (isPdfGenerated) {
                                let fileStat = yield utility.getFileStat(generatedDocPath);
                                var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, intDocType, userInfo._id);
                                patientVisitData.visitDocument = updatedVisitDocData;
                                let savePatientVisitDocument = yield patientVisitData.save();
                                var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + intDocType + '.pdf';
                                files.push(filename);
                            }
                        }
                        else {
                            otherTests.push(item.type);
                        }
                    }
                    if (otherTests && otherTests.length > 0) {
                        otherTests.forEach(function (test, index) {
                            console.log("test---->", test);
                            otherTests[index] = utility.translateIntRefToHebrew(test);
                            console.log("test conversion---->", otherTests[index]);  
                        });
                        console.log("otherTests join----->", otherTests.join(', '));
                        templateKeyValue[constantsObj.templateTag.REFERTO] = otherTests.join(' ,');
                        var intDocType = docType + '_' + 'OtherTest';
                        var generatedDocPath = path.resolve(visitDirPath, intDocType + '.pdf');
                        let isPdfGenerated = yield generateReferralDocument(_intRefTemplatePath, generatedDocPath, templateKeyValue);
                        if (isPdfGenerated) {
                            let fileStat = yield utility.getFileStat(generatedDocPath);
                            var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, intDocType, userInfo._id);
                            patientVisitData.visitDocument = updatedVisitDocData;
                            let savePatientVisitDocument = yield patientVisitData.save();
                            var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + intDocType + '.pdf';
                            files.push(filename);
                            return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                        }
                    }
                    else{
                        return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                    }

                }
                else if (docType == constantsObj.docType.TREATMENT_SUMMARY) {

                    console.log("docType--->", docType);
                    var generatedDocPath = path.resolve(visitDirPath, docType + '.pdf');
                    console.log("generatedDocPath--->", generatedDocPath);
                    let isPdfGenerated = yield generateReferralDocument(_treatmentSummaryTemplatePath, generatedDocPath, templateKeyValue);
                    console.log("isPdfGenerated------->", isPdfGenerated);
                    if (isPdfGenerated) {
                        var files = [];
                        let fileStat = yield utility.getFileStat(generatedDocPath);
                        var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, docType, userInfo._id);
                        patientVisitData.visitDocument = updatedVisitDocData;
                        let savePatientVisitDocument = yield patientVisitData.save();
                        var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + docType + '.pdf';
                        files.push(filename);
                        return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                    }
                    else {
                        return res.json(Response(402, "failed", constantmsg.docuementCreatedFailed));
                    }
                }
            }
            else if (req.body.docType == constantsObj.docType.PRESCRIPTION) {
                //Drugs list
                //internalRefferal
                var internalRefferal = [];
                if (patientVisitData.internalRefferal) {
                    for (var i = 0; i < patientVisitData.internalRefferal; i++) {
                        internalRefferal.push(utility.translateIntRefToHebrew(patientVisitData.internalRefferal[i].type));
                    }
                    internalRefferal = internalRefferal.join(' ,');
                }
                console.log('internalRefferal-->', internalRefferal);

                //Drugs details
                let orders = yield Order.findOne({ visitId: req.body.visitId }).lean().exec();
                var externalOrders = [];
                if (orders) {
                    externalOrders = orders.extOrder;
                }

                var objBeforeTranslation = {
                    patientName: utility.getDecryptText(patientVisitData.patientId.firstname) + '  ' + utility.getDecryptText(patientVisitData.patientId.lastname),
                    address: utility.getDecryptText(patientVisitData.patientId.address),
                    drName: userInfo.full,
                }

                var templateKeyValue = {};

                templateKeyValue[constantsObj.templateTag.PRINTING_TIME] = currentTimeMomentString;
                templateKeyValue[constantsObj.templateTag.NAME] = objBeforeTranslation.patientName;
                templateKeyValue[constantsObj.templateTag.ID] = utility.getDecryptText(patientVisitData.patientId.patientId);
                templateKeyValue[constantsObj.templateTag.HM] = hmo;
                templateKeyValue[constantsObj.templateTag.ADDRESS] = objBeforeTranslation.address;
                templateKeyValue[constantsObj.templateTag.PHONE] = utility.getDecryptText(patientVisitData.patientId.mobileNo);
                templateKeyValue[constantsObj.templateTag.AGE] = age;
                templateKeyValue[constantsObj.templateTag.DR_NAME] = objBeforeTranslation.drName;
                templateKeyValue[constantsObj.templateTag.REFERTO] = internalRefferal;
                templateKeyValue[constantsObj.templateTag.DRUG_TEST] = "";
                externalOrders.forEach(function (order) {
                    templateKeyValue[constantsObj.templateTag.DRUG_TEST] +=
                        "<tr><td style='padding: 7px 0;'><div style='float:right;'><span style='display: table-cell;'>" + order.description + "</span><span style='display: table-cell;'> שם התרופה </span> </div></td>" +
                        "<td style='padding: 7px 0;'><div style='float:right;'><span style='display: table-cell;'>" + order.prescriptionAmount + "</span><span style='display: table-cell;'>:מינון </span> </div></td>" +
                        "<td style='padding: 7px 0;'><div style='float:right;'><span style='display: table-cell;'>" + order.dosage + "</span><span style='display: table-cell;'>:כמות </span> </div></td>" +
                        "<td style='padding: 7px 0;'><div style='float:right;'><span style='display: table-cell;'>" + order.drugName + "</span><span style='display: table-cell;'>:הערות</span> </div></td></tr>";
                });
                var generatedDocPath = path.resolve(visitDirPath, docType + '.pdf');
                let isPdfGenerated = yield generateReferralDocument(_prescriptionTemplatePath, generatedDocPath, templateKeyValue);
                if (isPdfGenerated) {
                    var files = [];
                    let fileStat = yield utility.getFileStat(generatedDocPath);
                    var updatedVisitDocData = updateVisitDocData(patientVisitData.visitDocument, fileStat, docType, userInfo._id);
                    console.log("updatedVisitDocData: ", updatedVisitDocData);
                    patientVisitData.visitDocument = updatedVisitDocData;
                    let savePatientVisitDocument = yield patientVisitData.save();
                    var filename = patientVisitData.patientId.patientId + '_' + patientVisitData._id + '_' + docType + '.pdf';
                    console.log("Response Pdf---->", filename);
                    files.push(filename);
                    return res.json({ 'code': 200, status: 'success', "message": constantmsg.docuementCreatedSuccess, "data": files });
                }
                else {
                    return res.json(Response(402, "failed", constantmsg.docuementCreatedFailed));
                }
            }
        } else {
            return res.json(Response(402, "failed", constantmsg.docuementCreatedFailed, err));
        }
    }).catch(function (err) {
        console.log('issueDocument err:', err);
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
function getdoc(req, res) {
    co(function* () {
        var idInfo = req.params.id;
        console.log("IdInfo", idInfo);
        var parts = idInfo.split('_');
        var fileBasename = "";
        if (parts.length == 4) {
            fileBasename = parts[2] + '_' + parts[3];
        }
        else {
            fileBasename = parts[2];
        }
        var patientId = utility.getDecryptText(parts[0]);
        var visitId = parts[1];

        var visitDirName = patientId + '/' + visitId;
        var visitDirPath = path.resolve('./EMCDocuments/', visitDirName);
        console.log("visitDirPath", visitDirPath);
        var filePath = path.resolve(visitDirPath, fileBasename);
        console.log("Filepath:--->", filePath);
        console.log(filePath);
        let data = yield utility.readFile(filePath);
        var base64 = data.toString('base64');
        res.send(base64);
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
    console.log('updateVisitDocData');
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
                'name': docType,
                'ext': '.pdf'
            })
        }
        return visitDocuments;
    }
}

/**
 * Function is use to generate referral document
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-May-2017
 */
function generateReferralDocument(docTemplatePath, generatedDocPath, templateKeyValue) {
    console.log('generateReferralDocument');
    return new Promise(function (resolve, reject) {
        jsrender.loadFile('#myTemplate', docTemplatePath, function (err, template) {
            if (!err) {
                console.log("err--->", err);
                console.log("templateKeyValue--->", templateKeyValue);
                var final_html = jsrender.render['#myTemplate'](templateKeyValue);
                // console.log("final_html:--->", final_html);
                var options = {
                    "height": "15.5in",        // allowed units: mm, cm, in, px 
                    "width": "16in",            // allowed units: mm, cm, in, px 
                    "format": "Letter",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid 
                    "orientation": "portrait",
                    "phantomPath": "./node_modules/phantomjs/bin/phantomjs"
                };

                pdf.create(final_html, options).toFile(generatedDocPath, function (err, res) {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                console.log("err--->", err);
                resolve(false);
            }
        });
    });
}

function issueDebtInvoice(patientVisitData, sum, billData, settingInfo) {
    console.log('issueDebtInvoice: ');
    return new Promise(function (resolve, reject) {
        console.log("sum:-------> ", sum);
        console.log("billData:-------> ", billData);

        var itemsList = [];
        itemsList.push({ description: 'Visit Payment', unitprice: billData.visitPayment, quantity: 1 });
        if (billData.previousDebt !== 0) {
            itemsList.push({ description: 'Previous Debt', unitprice: billData.previousDebt, quantity: 1 });
        }
        //sum = 0;
        for (var i = 0; i < billData.billableItems.length; i++) {
           // sum = sum + billData.billableItems[i].price;
            //console.log("Sum", i + " " + sum);
            itemsList.push({ description: billData.billableItems[i].name, unitprice: billData.billableItems[i].price, quantity: 1 });
        }
        //Take icount auth information setted by admin
        //let settingInfo = yield Setting.find({});
        console.log('settingInfo:---->', settingInfo);
        var icount_cid = '';
        var icount_username = '';
        var icount_password = '';

        if (settingInfo && settingInfo[0] && settingInfo[0].clientId && settingInfo[0].clientUsername && settingInfo[0].clientPassword) {
            icount_cid = settingInfo[0].clientId;
            icount_username = settingInfo[0].clientUsername;
            icount_password = settingInfo[0].clientPassword;
            console.log('icount_cid:---->' + icount_cid + "----icount_username----" + icount_username + "----icount_password----" + icount_password);
        }
        if (patientVisitData && patientVisitData.patientId) {
            var client_name = utility.getDecryptText(patientVisitData.patientId.firstname) + " " + utility.getDecryptText(patientVisitData.patientId.lastname);
            var data = querystring.stringify({
                doctype: 'deal',
                cid: icount_cid,
                user: icount_username,
                pass: icount_password,
                vat_id: '123456789',
                lang: "en",
                currency_code: billData.currency,
                client_name: client_name,
                email: patientVisitData.patientId.email,
                items: itemsList,
                totalsum: sum
            }, { encodeValuesOnly: true })
            console.log("querystring:", data);

            var url = constantsObj.invoiceConfig.CREATE_DOC_URL + data;

            https.get(url, function (response) {
                // data is streamed in chunks from the server
                // so we have to handle the "data" event    
                var buffer = "",
                    data,
                    route;

                response.on("data", function (chunk) {
                    buffer += chunk;
                });

                response.on("end", function (err) {
                    data = JSON.parse(buffer);
                    console.log('response:', data.api.messages);
                    var invoiceIssuedData = {};
                    //Update billpayed in db
                    if (data.reason == 'OK' && data.status == true) {
                        invoiceIssuedData.docnum = data.docnum;
                        invoiceIssuedData.doc_url = data.doc_url;
                        invoiceIssuedData.doc_copy_url = data.doc_copy_url;
                        console.log('invoiceIssuedData--------------->', invoiceIssuedData);
                        resolve(invoiceIssuedData.docnum);
                    }
                    else {
                        reject(false);
                    }
                });
            });
        }
    })
}

/**
 * Function is use close visit and send survey to patient
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-May-2017
 */
function closeVisitAndSendSurvey(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');
        var patientInfo = patientVisitData.patientId;
        if (patientVisitData) {
            patientVisitData.visitIsClosed = 1;
            //Calculate visit duration
            // var current_time = moment();
            // current_time = moment(current_time);
            // var visitStart = moment(patientVisitData.visitStart);
            // var diff = current_time.diff(visitStart);
            // var duration = moment.duration(diff);
            // var visitDuration = duration.format("DD hh:mm:ss");

            var current_time = moment.utc();
            //current_time = moment(current_time);
            var visitStart = moment(patientVisitData.visitStart);
            var diff = current_time.diff(visitStart);
            var duration = moment.duration(diff);
            var visitDuration = duration.format("DD hh:mm:ss");
            patientVisitData.visitDuration = visitDuration;
            //visit end
            //var visitEnd = current_time.tz("Israel").format();
            var visitEnd = current_time;
            patientVisitData.visitEnd = visitEnd;
            //Check for any payment details of visit
            let paymentInfo = yield VisitPayment.findOne({ visitId: req.body.visitId }).exec();
            console.log("paymentInfo:----->", paymentInfo);
            var debt = 0;
            console.log("paymentInfo.billList:----->", paymentInfo.billList);
            if (paymentInfo.billList) {
                for (var i = 0; i < paymentInfo.billList.length; i++) {
                    console.log("billList eleemnt:----->", paymentInfo.billList[i]);
                    if (paymentInfo.billList[i].isBillPayed == false) {
                        console.log("paymentInfo.billList[i].previousDebt: ", paymentInfo.billList[i].previousDebt);
                        console.log("paymentInfo.billList[i].visitPayment: ", paymentInfo.billList[i].visitPayment);
                        debt = debt + paymentInfo.billList[i].previousDebt + paymentInfo.billList[i].visitPayment;
                        console.log("Debt: ", debt);
                        for (var j = 0; j < paymentInfo.billList[i].billableItems.length; j++) {
                            console.log("j", j);
                            console.log("paymentInfo.billList[i].billableItems", paymentInfo.billList[i].billableItems[j]);
                            debt = debt + paymentInfo.billList[i].billableItems[j].price;
                        }
                        let settingInfo = yield Setting.find({});
                        let isIssuedDealInvoice = yield issueDebtInvoice(patientVisitData, debt, paymentInfo.billList[i], settingInfo);
                        console.log("isIssuedDealInvoice", isIssuedDealInvoice);
                        if(isIssuedDealInvoice){
                            paymentInfo.billList[i].debtDocNum = isIssuedDealInvoice;
                            let saveData = yield paymentInfo.save();
                        }
                    }
                    console.log("Debt: ", debt);
                }
            }
            console.log("Final Debt: ", debt);
            var mainStage = '';
            // var statusName = '';
            if (paymentInfo.billList && paymentInfo.billList.length > 0 && debt == 0) {
                patientVisitData.isPaymentDone = 1;
                let completedStatus = yield Status.findOne({ id: constantsObj.statusId.COMPLETED }).lean();
                mainStage = completedStatus.id;
            }
            else {
                let completedUnpaidStatus = yield Status.findOne({ id: constantsObj.statusId.COMPLETED_UNPAID }).lean();
                mainStage = completedUnpaidStatus.id;
            }
            patientVisitData.currentStatus = mainStage;
            let savedData = yield patientVisitData.save();

            let patientData = yield Patient.findById(patientVisitData.patientId);
            if (patientData) {
                patientData.previousDebt = debt;
                patientData.status = 0;
                let savedData = yield patientData.save();
            }
            //Add survey empty details for visit 
            // var feedback = [];
            // let surveyList = yield Survey.find({}).lean().exec();
            // if (surveyList && surveyList.length > 0) {
            //     if (surveyList[0].question) {
            //         var questions = surveyList[0].question;
            //         for (var i = 0; i < questions.length; i++) {
            //             feedback.push({ question: questions[i].description, questionType: questions[i].type, answer: '' })
            //         }
            //     }
            // }
            // var savedVisitSurveyData = [];
            // let isVisitSurveyCreated = yield VisitSurvey.findOne({ visitId: req.body.visitId });
            // if (isVisitSurveyCreated) {
            //     isVisitSurveyCreated.feedback = feedback;
            //     savedVisitSurveyData = yield isVisitSurveyCreated.save();
            // }
            // else {
            //     savedVisitSurveyData = yield new VisitSurvey({
            //         "visitId": req.body.visitId,
            //         "extraComment": "",
            //         "feedback": feedback,
            //     }).save();
            //     console.log("savedVisitSurveyData:--->", savedVisitSurveyData);
            // }

            //--------------------Take survey link from settings--------------------------
            let settingInfo = yield Setting.find({});
            console.log('settingInfo:---->', settingInfo);
            var surveyLink_En = '';
            var surveyLink_Hw = '';
            var emailTemplateFile = '';
            
            if (settingInfo && settingInfo[0] && settingInfo[0].surveyEnLink && settingInfo[0].surveyHwLink) {
                surveyLink_En = settingInfo[0].surveyEnLink;
                surveyLink_Hw = settingInfo[0].surveyHwLink;
                if(settingInfo[0].isSurveyEnEnabled && settingInfo[0].isSurveyHwEnabled){
                    console.log("both  enbles");
                    emailTemplateFile = "survey_both";
                }
                else if((settingInfo[0].isSurveyEnEnabled && !settingInfo[0].isSurveyHwEnabled) ){
                    console.log("English enabled");
                    emailTemplateFile = "survey_en";
                }
                else if(!settingInfo[0].isSurveyEnEnabled && settingInfo[0].isSurveyHwEnabled){
                    console.log("Hebrew enabled");
                    emailTemplateFile = "survey_hw";
                }
                console.log('surveyLink_Eng:---->' + surveyLink_En + "----surveyLink_Heb----" + surveyLink_Hw);
            }
            console.log("emailTemplateFile---------->", emailTemplateFile);
            //Diasable Alerts for visit if any
            let previousAlerts = yield Alert.find({ visitId: req.body.visitId, status: 1 }).exec();
            if (previousAlerts && previousAlerts.length > 0) {
                for (var i = 0; i < previousAlerts.length; i++) {
                    previousAlerts[i].status = 0;
                    let savedData = yield previousAlerts[i].save();
                }
            }

            //update stage info
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'closure_summary', mainStage, userInfo._id);
            stageData.mainStage = stageInfo.mainStage;
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            var userMailData = { email: patientInfo.email, firstname: utility.getDecryptText(patientInfo.firstname), lastname: utility.getDecryptText(patientInfo.lastname), visitId: patientVisitData._id, surveyLink_En: surveyLink_En, surveyLink_Hw: surveyLink_Hw   };
            utility.readTemplateSendMail(patientInfo.email, constantsObj.emailSubjects.survey_email, userMailData, emailTemplateFile, '', function (err, resp) { });
            return res.json(Response(200, "success", constantmsg.VisitClosedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.VisitClosedFailed, err));
        }
    }).catch(function (err) {
        console.log("visit closed:", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
};


/**
 * Function is use get visit docuemnt information
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */
function getVisitDocumentInfoById(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let patientVisitData = yield Visit.findById(id).lean().exec();
        if (patientVisitData) {
            var visitDocument = patientVisitData.visitDocument;
            for (var i = 0; i < visitDocument.length; i++) {
                let userInfo = yield User.findById(visitDocument[i].submittedBy);
                visitDocument[i].submittedBy = userInfo.full;
            }
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": visitDocument });
        } else {
            return res.json(Response(402, "failed",constantmsg.VisitClosedFailed));
        }
    }).catch(function (err) {
        console.log('getVisitDocumentInfoById err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
};

/**
 * Function is use get patient visit history
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 29-May-2017
 */
function getPatientVisitHistory(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
         var id = req.body.visitId;
        let patientVisitData = yield Visit.findById(id).lean().exec();
        var patientId = patientVisitData.patientId;
        var count = req.body.count ? req.body.count : 0;
        var skip = req.body.count * (req.body.page - 1);
        let sorting = utility.getSortObj(req.body);
        var condition = { patientId: patientId, visitIsClosed: 1 };
        var searchText = req.body.searchText;
        if (req.body.searchText) {
            condition.$or = [ { 'visitReason': new RegExp(searchText, 'gi') }, { 'treatmentResultType': new RegExp(searchText, 'gi') }, { 'visitDuration': new RegExp(searchText, 'gi') }];
        }
        let completedVisits = yield Visit.find(condition, { patientId: 1, visitStart: 1, visitReason: 1, treatmentResultType: 1, visitDuration: 1 }).populate('patientId', 'patientId  firstname lastname age')
            .limit(parseInt(count))
            .skip(parseInt(skip))
            .sort(sorting)
            .lean().exec();
        var getCount = Visit.find(condition).count().exec();
        getCount.then(function (totalLength) {
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": completedVisits, "totalLength": totalLength });
        }).catch(function (err) {
            console.log('getPatientVisitHistory err:', err);
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
    });
};

/**
 * Function is use get visit history
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 29-May-2017
 */
function getVisitHistory(req, res) {
    console.log("getVisitHistory");
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let sort = utility.getSortObj(req.body);
        let count = parseInt(req.body.count ? req.body.count : 0);
        let skip = parseInt(req.body.count * (req.body.page - 1));
        var searchText = req.body.searchText;
        var condition = { visitIsClosed: 1 };
        if (searchText != undefined && searchText != 'undefined') {
            condition.$or = [
                //  { 'visitStart': new RegExp(searchText, 'gi') },
                //  { 'visitEnd': new RegExp(searchText, 'gi') },
                //  { 'visitDuration': new RegExp(searchText, 'gi') },
                { 'visitReason': new RegExp(searchText, 'gi') },
                { 'treatmentResultType': new RegExp(searchText, 'gi') },
                { 'patientInfo.firstname': new RegExp(searchText, 'gi') }
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
        { $match: condition }
            , {
            $project: {
                visitStart: 1,
                visitEnd: 1,
                visitDuration: 1,
                visitReason: 1,
                treatmentResultType: 1,
                patientInfo: '$patientInfo'
                // patient: {
                //     _id: '$patientInfo._id',
                //     full: '$patientInfo.full',
                // },
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
        let visitList = yield Visit.aggregate(aggregate);
        for (var i = 0; i < visitList.length; i++) {
            visitList[i].visitEnd = moment(visitList[i].visitEnd).tz("Israel").format();
            visitList[i].visitStart = moment(visitList[i].visitStart).tz("Israel").format();
            visitList[i].patientInfo.firstname = utility.getDecryptText(visitList[i].patientInfo.firstname);
        }
        var getCount = Visit.find(condition).count().exec();
        getCount.then(function (totalLength) {
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": visitList, "totalLength": totalLength });
        }).catch(function (err) {
            console.log('getVisitHistory err:', err);
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
    });
}

/**
 * Function is update status
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-May-2017
 */
function updateStatus(req, res) {
    console.log('updateStatus');
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        let statusInfo = yield Status.findOne({ id: Number(req.body.status) }).lean();
        if (patientVisitData) {
            patientVisitData.currentStatus = statusInfo.id;
            let savedData = yield patientVisitData.save();
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, '', statusInfo.id, userInfo._id);
            stageData.mainStage = stageInfo.mainStage;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.visitReasonSuccess, {}));
        }
        else {
            return res.json(Response(402, "failed", constantmsg.visitDetailsUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('updateStatus err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is use to get visit stage info by ID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-May-2017
 */
function getStageInfoById(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let visitStageInfo = yield VisitStage.findOne({ visitId: id }).lean().exec();
        for (var i = 0; i < visitStageInfo.mainStage.length; i++) {
            visitStageInfo.mainStage[i].updatedAt = moment(visitStageInfo.mainStage[i].updatedAt).tz("Israel").format();
            let statusInfo = yield Status.findOne({ id: Number(visitStageInfo.mainStage[i].name) }).lean();
            visitStageInfo.mainStage[i].id = statusInfo.name;
        }
        for (var i = 0; i < visitStageInfo.stages.length; i++) {
            visitStageInfo.stages[i].updatedAt = moment(visitStageInfo.stages[i].updatedAt).tz("Israel").format();
        }
        // console.log("----------visitStageInfo-----------", visitStageInfo);
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": visitStageInfo });
    }).catch(function (err) {
        console.log("err:", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is to update stage object with stage data 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 30-May-2017
 */
function updateStageInfo(stageData, subStageName, mainStageName, userId) {
    var current_time = moment.utc();
    if (stageData) {
        if (subStageName !== '') {
            var isSubStagefound = 0;
            for (var i = 0; i < stageData.stages.length; i++) {
                if (stageData.stages[i].name == subStageName) {
                    isSubStagefound = 1;
                    stageData.stages[i].editedBy = userId;
                    stageData.stages[i].updatedAt = current_time;
                    stageData.stages[i].isCompleted = 1;
                    break;
                }
            }
            if (isSubStagefound == 0) {
                stageData.stages.push({
                    name: subStageName,
                    editedBy: userId,
                    updatedAt: current_time,
                    createdAt: current_time,
                    isCompleted: 1
                });
            }
        }
        if (mainStageName !== '') {
            var isMainStagefound = 0;
            for (var i = 0; i < stageData.mainStage.length; i++) {
                if (stageData.mainStage[i].name == mainStageName) {
                    isMainStagefound = 1;
                    stageData.mainStage[i].editedBy = userId;
                    stageData.mainStage[i].updatedAt = current_time;
                    break;
                }
            }
            if (isMainStagefound == 0) {
                stageData.mainStage.push({
                    name: mainStageName,
                    editedBy: userId,
                    updatedAt: current_time,
                    createdAt: current_time,
                });
            }
        }
    }
    return stageData;
}


/**
 * Function is to update stage object with stage data 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 02-June-2017
 */
function addPatientDrugs(req, res) {
    console.log('addPatientDrugs', req.body);
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            let prescriptionData = yield Order.findOne({ visitId: req.body.visitId });
            console.log('prescriptionData: ', prescriptionData);
            if (prescriptionData) {
                prescriptionData.emcOrder = req.body.emcOrder;
                let savedPrescriptionData = yield prescriptionData.save();
                console.log('savedPrescriptionData: ', savedPrescriptionData);
                for (var i = 0; i < req.body.emcOrder.length; i++) {
                    var drugName = req.body.emcOrder[i].drugName;
                    var quantity = req.body.emcOrder[i].givenAmount;
                    let drugInfo = yield Inventory.findOne({ drugName: drugName });
                    if (drugInfo && drugInfo.drugDetails) {
                        for (var j = 0; j < drugInfo.drugDetails.length; j++) {
                            if (drugInfo.drugDetails[j].dosage == req.body.emcOrder[i].dosage) {
                                drugInfo.drugDetails[j].quantity = drugInfo.drugDetails[j].quantity - req.body.emcOrder[i].givenAmount;
                                break;
                            }
                        }
                    }
                    let savedDrugInfo = yield drugInfo.save();
                }
                //update stage info
                let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
                var stageInfo = updateStageInfo(stageData, 'closure_drug', '', userInfo._id);
                stageData.stages = stageInfo.stages;
                let stageDataSaved = yield stageData.save();
            }
            return res.json(Response(200, "success", constantmsg.orderUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsgs.orderUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addPatientDrugs err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to send generated treatment summary to family doctor
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 07-June-2017
 */
function sendSummaryToFamilyDoctor(req, res) {
    console.log("sendSummaryToFamilyDoctor");
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');
        var visitDirName = utility.getDecryptText(patientVisitData.patientId.patientId) + '/' + patientVisitData._id;
        var visitDirPath = path.resolve('./EMCDocuments/', visitDirName);
        var filePath = path.resolve(visitDirPath, 'Treatment Summary' + '.pdf');
        console.log("filepath-->", filePath);
        let isTreatmentSummaryGenerated = yield utility.fileExistCheck(filePath);
        if (isTreatmentSummaryGenerated) {
            var attachementList = [];
            var visitDirName = utility.getDecryptText(patientVisitData.patientId.patientId) + '/' + patientVisitData._id;
            var visitDirPath = path.resolve('./EMCDocuments/', visitDirName);
            console.log("visitDirPath:----------->", visitDirPath);
            if (patientVisitData.visitDocument) {
                for (var i = 0; i < patientVisitData.visitDocument.length; i++) {
                    var filename = patientVisitData.visitDocument[i].name + patientVisitData.visitDocument[i].ext;
                    var filePath = path.resolve(visitDirPath, filename);
                    let fileData = yield utility.readFile(filePath);
                    console.log("filePath:--->", filePath);
                    attachementList.push({
                        'filename': filename,
                        'contents': fileData
                    });
                    console.log("attachementList:----------->", attachementList);
                }
            }
            if (patientVisitData && patientVisitData.patientId && patientVisitData.patientId._id) {
                let patientInfo = yield Patient.findById(patientVisitData.patientId._id).populate('familyDoctorId');
                var familyDrInfo = patientInfo.familyDoctorId;
                if (familyDrInfo) {
                    var userMailData = { email: familyDrInfo.email, drFirstname: familyDrInfo.firstname, drLastname: familyDrInfo.lastname, patient_firstname: utility.getDecryptText(patientInfo.firstname), patient_lastname: utility.getDecryptText(patientInfo.lastname) };
                    utility.readTemplateSendMail(familyDrInfo.email, constantsObj.emailSubjects.familyDr_email, userMailData, 'summary_familyDoctor', attachementList, function (err, resp) { });
                    return res.json(Response(200, "success", constantmsg.summaryMailedSuccess, {}));
                }
            }
            else {
                console.log("err 1:----------->");
                return res.json(Response(402, "failed", constantmsg.summaryNotGenerated, {}));
            }
        } else {
            console.log("err 1:----------->");
            return res.json(Response(402, "failed", constantmsg.summaryNotGenerated, {}));
        }
    }).catch(function (err) {
        console.log("sendSummaryToFamilyDoctor:", err);
        return res.json(Response(500, "failed", utility.validationErrorHandler(err), err));
    });
};

/**
 * Function is tirage details 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 13-June-2017
 */
function addVisitComment(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        console.log("Visit comment:", req.body.visitComment);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        var newComments = req.body.visitComment;
        //add comment submittedBy by, createdAt property in each new comment
        newComments.forEach(function (obj) {
            obj.submittedBy = userInfo._id;
            obj.createdAt = new Date();
        });
        // console.log("Before patientVisitData", patientVisitData);
        if (patientVisitData) {
            for (var i = 0; i < newComments.length; i++) {
                patientVisitData.visitComment.push(newComments[i]);
            }
            let savedpatientVisitData = yield patientVisitData.save();
            //   console.log("after patientVisitData", savedpatientVisitData);
        }

        return res.json(Response(200, "success", constantmsg.commentSavedSuccess, {}));
    }).catch(function (err) {
        console.log('addVisitComment err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to issue invoice
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 16-May-2017
 */
// function issueInvoice(req, res) {
//     console.log('issueInvoice: ');
//   //  console.log('body--->', req.body);
//     var paymentData = req.body.paymentData;
//     co(function* () {
//         let paymentInfo = yield VisitPayment.findOne({ visitId: req.body.visitId }).exec();

//         var itemsList = [];
//         var sum = 0;
//         itemsList.push({ description: 'Visit Payment', unitprice: paymentData.billData.visitPayment, quantity: 1 });
//         if (paymentData.billData.previousDebt !== 0) {
//             itemsList.push({ description: 'Previous Debt', unitprice: paymentData.billData.previousDebt, quantity: 1 });
//         }
//         for (var i = 0; i < paymentData.billData.billableItems.length; i++) {
//             sum = sum + paymentData.billData.billableItems[i].price;
//             console.log("Sum", i + " " + sum);
//             itemsList.push({ description: paymentData.billData.billableItems[i].name, unitprice: paymentData.billData.billableItems[i].price, quantity: 1 });
//         }
//         var paymentArray = {};
//         sum = sum + paymentData.billData.previousDebt + paymentData.billData.visitPayment;
//         console.log("sum: ", sum);
//         let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');

//         //Take icount auth information setted by admin
//         let settingInfo = yield Setting.find({});
//         console.log('settingInfo:---->', settingInfo);
//         var icount_cid = '';
//         var icount_username = '';
//         var icount_password = '';

//         if (settingInfo && settingInfo[0] && settingInfo[0].clientId && settingInfo[0].clientUsername && settingInfo[0].clientPassword ) {
//                 icount_cid =  settingInfo[0].clientId;
//                 icount_username = settingInfo[0].clientUsername;
//                 icount_password = settingInfo[0].clientPassword;
//                 console.log('icount_cid:---->' + icount_cid + "----icount_username----" + icount_username + "----icount_password----" + icount_password);
//         }
//         if (patientVisitData && patientVisitData.patientId) {
//             var client_name = patientVisitData.patientId.firstname + " " + patientVisitData.patientId.lastname;
//             if (paymentData.billData.paymentType == 'cash') {
//                 paymentArray = { sum: sum };
//                 var data = querystring.stringify({
//                     doctype: 'receipt',
//                     // cid: constantsObj.invoiceConfig.CID,
//                     // user: constantsObj.invoiceConfig.USERNAME,
//                     // pass: constantsObj.invoiceConfig.PASSWORD,
//                     cid: icount_cid,
//                     user: icount_username,
//                     pass: icount_password,
//                     vat_id: '123456789',
//                     lang: "en",
//                     currency_code: paymentData.billData.currency,
//                     client_name: client_name,
//                     email: patientVisitData.patientId.email,
//                     items: itemsList,
//                     cash: paymentArray
//                 }, { encodeValuesOnly: true })
//                 console.log("querystring:", data);
//             }

//             else if (paymentData.billData.paymentType == 'credit') {
//                 paymentArray = { sum: sum, card_type: paymentData.paidWithInfo.cardType, card_number: paymentData.paidWithInfo.cc, exp_year: 2020, exp_month: 3, holder_id: "123456789", holder_name: "Israel Israeli", confirmation_code: "875646" };
//                 console.log("paymentArray: ", paymentArray);
//                 var data = querystring.stringify({
//                     doctype: 'receipt',
//                     // cid: constantsObj.invoiceConfig.CID,
//                     // user: constantsObj.invoiceConfig.USERNAME,
//                     // pass: constantsObj.invoiceConfig.PASSWORD,
//                     cid: icount_cid,
//                     user: icount_username,
//                     pass: icount_password,
//                     vat_id: '123456789',
//                     lang: "en",
//                     currency_code: paymentData.billData.currency,
//                     client_name: client_name,
//                     email: patientVisitData.patientId.email,
//                     items: itemsList,
//                     cc: paymentArray
//                 }, { encodeValuesOnly: true })
//                 console.log("querystring:", data);
//             }

//             else if (paymentData.billData.paymentType == 'cheque') {
//                  var chequeList = [];
//                 chequeList.push({  sum: sum, date: new Date(), branch: "0000", bank: "0000", account: "0000", number: paymentData.paidWithInfo.chequeNumber});
//                 console.log("paymentArray: ", paymentArray);
//                 var data = querystring.stringify({
//                     doctype: 'receipt',
//                     // cid: constantsObj.invoiceConfig.CID,
//                     // user: constantsObj.invoiceConfig.USERNAME,
//                     // pass: constantsObj.invoiceConfig.PASSWORD,
//                     cid: icount_cid,
//                     user: icount_username,
//                     pass: icount_password,
//                     vat_id: '123456789',
//                     lang: "en",
//                     currency_code: paymentData.billData.currency,
//                     client_name: client_name,
//                     email: patientVisitData.patientId.email,
//                     items: itemsList,
//                     cheques: chequeList
//                 }, { encodeValuesOnly: true })
//                 console.log("querystring:", data);
//             }
//             var url = constantsObj.invoiceConfig.CREATE_DOC_URL + data;

//             https.get(url, function (response) {
//                 // data is streamed in chunks from the server
//                 // so we have to handle the "data" event    
//                 var buffer = "",
//                     data,
//                     route;

//                 response.on("data", function (chunk) {
//                     buffer += chunk;
//                 });

//                 response.on("end", function (err) {
//                     data = JSON.parse(buffer);
//                     console.log('response:', data);
//                     var invoiceIssuedData = {};
//                     //Update billpayed in db
//                     if (data.reason == 'OK' && data.status == true) {
//                         invoiceIssuedData.docnum = data.docnum;
//                         invoiceIssuedData.doc_url = data.doc_url;
//                         invoiceIssuedData.doc_copy_url = data.doc_copy_url;
//                         console.log('invoiceIssuedData', invoiceIssuedData);
//                         co(function* () {
//                             if (paymentInfo) {
//                                 console.log("paymentData.billData._id: ", paymentData.billData._id);
//                                 for (var i = 0; i < paymentInfo.billList.length; i++) {
//                                     if (paymentInfo.billList[i]._id == paymentData.billData._id) {
//                                         paymentInfo.billList[i].isDocIssued = true;
//                                         paymentInfo.billList[i].invoiceIssuedData = invoiceIssuedData;
//                                     }
//                                 }
//                                 let savedData = yield paymentInfo.save();
//                                 return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.invoiceIssuedSuccess, "data": invoiceIssuedData });
//                             }
//                         });
//                     }
//                     else {
//                         return res.json({ 'code': 402, status: 'failed', "message": constantsObj.messages.invoiceIssuedFailed });
//                     }
//                 });
//             });
//         }
//     }).catch(function (err) {
//         console.log(err, 'errrrrr');
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
//     });
// }
function issueInvoice(req, res) {
    console.log('issueInvoice: ');
    var paymentData = req.body.paymentData;
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let paymentInfo = yield VisitPayment.findOne({ visitId: req.body.visitId }).exec();

        var itemsList = [];
        var sum = 0;
        itemsList.push({ description: 'Visit Payment', unitprice: paymentData.billData.visitPayment, quantity: 1 });
        if (paymentData.billData.previousDebt !== 0) {
            itemsList.push({ description: 'Previous Debt', unitprice: paymentData.billData.previousDebt, quantity: 1 });
        }
        for (var i = 0; i < paymentData.billData.billableItems.length; i++) {
            sum = sum + paymentData.billData.billableItems[i].price;
            console.log("Sum", i + " " + sum);
            itemsList.push({ description: paymentData.billData.billableItems[i].name, unitprice: paymentData.billData.billableItems[i].price, quantity: 1 });
        }
        var paymentArray = {};
        var baseDocArray = {};
        if(paymentData.billData.debtDocNum){
             baseDocArray = { doctype: 'deal', docnum: paymentData.billData.debtDocNum };
        }
        console.log("baseDocArray---->", baseDocArray);
        sum = sum + paymentData.billData.previousDebt + paymentData.billData.visitPayment;
        console.log("sum: ", sum);
        let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');

        //Take icount auth information setted by admin
        let settingInfo = yield Setting.find({});
        console.log('settingInfo:---->', settingInfo);
        var icount_cid = '';
        var icount_username = '';
        var icount_password = '';

        if (settingInfo && settingInfo[0] && settingInfo[0].clientId && settingInfo[0].clientUsername && settingInfo[0].clientPassword) {
            icount_cid = settingInfo[0].clientId;
            icount_username = settingInfo[0].clientUsername;
            icount_password = settingInfo[0].clientPassword;
            console.log('icount_cid:---->' + icount_cid + "----icount_username----" + icount_username + "----icount_password----" + icount_password);
        }
        if (patientVisitData && patientVisitData.patientId) {
            var client_name = utility.getDecryptText(patientVisitData.patientId.firstname) + " " + utility.getDecryptText(patientVisitData.patientId.lastname);
             if (paymentData.billData.paymentType == 'cash') {
                paymentArray = { sum: sum };
                if(paymentData.billData.debtDocNum){
                    var data = querystring.stringify({
                    doctype: 'receipt',
                    cid: icount_cid,
                    user: icount_username,
                    pass: icount_password,
                    vat_id: '123456789',
                    lang: "en",
                    currency_code: paymentData.billData.currency,
                    client_name: client_name,
                    email: patientVisitData.patientId.email,
                    items: itemsList,
                    cash: paymentArray,
                    baseDocArray: baseDocArray
                }, { encodeValuesOnly: true })
                console.log("querystring:", data);
                }
                else{
                    var data = querystring.stringify({
                    doctype: 'receipt',
                    cid: icount_cid,
                    user: icount_username,
                    pass: icount_password,
                    vat_id: '123456789',
                    lang: "en",
                    currency_code: paymentData.billData.currency,
                    client_name: client_name,
                    email: patientVisitData.patientId.email,
                    items: itemsList,
                    cash: paymentArray
                }, { encodeValuesOnly: true })
                console.log("querystring:", data);
                }
            }

            else if (paymentData.billData.paymentType == 'credit') {
                paymentArray = { sum: sum, card_type: paymentData.paidWithInfo.cardType, card_number: paymentData.paidWithInfo.cc, exp_year: 2020, exp_month: 3, holder_id: "123456789", holder_name: "Israel Israeli", confirmation_code: "875646" };
                console.log("paymentArray: ", paymentArray);
                var data = querystring.stringify({
                    doctype: 'receipt',
                    cid: icount_cid,
                    user: icount_username,
                    pass: icount_password,
                    vat_id: '123456789',
                    lang: "en",
                    currency_code: paymentData.billData.currency,
                    client_name: client_name,
                    email: patientVisitData.patientId.email,
                    items: itemsList,
                    cc: paymentArray
                }, { encodeValuesOnly: true })
                console.log("querystring:", data);
            }

            else if (paymentData.billData.paymentType == 'cheque') {
                var chequeList = [];
                chequeList.push({ sum: sum, date: new Date(), branch: "0000", bank: "0000", account: "0000", number: paymentData.paidWithInfo.chequeNumber });
                console.log("paymentArray: ", paymentArray);
                var data = querystring.stringify({
                    doctype: 'receipt',
                    cid: icount_cid,
                    user: icount_username,
                    pass: icount_password,
                    vat_id: '123456789',
                    lang: "en",
                    currency_code: paymentData.billData.currency,
                    client_name: client_name,
                    email: patientVisitData.patientId.email,
                    items: itemsList,
                    cheques: chequeList
                }, { encodeValuesOnly: true })
                console.log("querystring:", data);
            }
            var url = constantsObj.invoiceConfig.CREATE_DOC_URL + data;

            https.get(url, function (response) {
                // data is streamed in chunks from the server
                // so we have to handle the "data" event    
                var buffer = "",
                    data,
                    route;

                response.on("data", function (chunk) {
                    buffer += chunk;
                });

                response.on("end", function (err) {
                    data = JSON.parse(buffer);
                    console.log('response:', data.api.messages);
                    var invoiceIssuedData = {};
                    //Update billpayed in db
                    if (data.reason == 'OK' && data.status == true) {
                        invoiceIssuedData.docnum = data.docnum;
                        invoiceIssuedData.doc_url = data.doc_url;
                        invoiceIssuedData.doc_copy_url = data.doc_copy_url;
                        console.log('invoiceIssuedData', invoiceIssuedData);
                        co(function* () {
                            if (paymentInfo) {
                                console.log("paymentData.billData._id: ", paymentData.billData._id);
                                for (var i = 0; i < paymentInfo.billList.length; i++) {
                                    if (paymentInfo.billList[i]._id == paymentData.billData._id) {
                                        paymentInfo.billList[i].isDocIssued = true;
                                        paymentInfo.billList[i].invoiceIssuedData = invoiceIssuedData;
                                    }
                                }
                                let savedData = yield paymentInfo.save();
                                return res.json({ 'code': 200, status: 'success', "message": constantmsg.invoiceIssuedSuccess, "data": invoiceIssuedData });
                            }
                        });
                    }
                    else {
                        return res.json({ 'code': 402, status: 'failed', "message": constantmsg.invoiceIssuedFailed });
                    }
                });
            });
        }
    }).catch(function (err) {
        console.log(err, 'errrrrr');
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to email issued invoice
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 16-May-2017
 */
function emailInvoice(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');
        if (patientVisitData && patientVisitData.patientId) {
            //Take icount auth information setted by admin
            let settingInfo = yield Setting.find({});
            console.log('settingInfo:---->', settingInfo);
            var icount_cid = '';
            var icount_username = '';
            var icount_password = '';

            if (settingInfo && settingInfo[0] && settingInfo[0].clientId && settingInfo[0].clientUsername && settingInfo[0].clientPassword) {
                icount_cid = settingInfo[0].clientId;
                icount_username = settingInfo[0].clientUsername;
                icount_password = settingInfo[0].clientPassword;
                console.log('icount_cid:---->' + icount_cid + "----icount_username----" + icount_username + "----icount_password----" + icount_password);
            }
            var subject = "Invoice num:" + req.body.invoiceIssuedData.docnum + " from EMC Healthcare";
            var client_name = utility.getDecryptText(patientVisitData.patientId.firstname) + " " + utility.getDecryptText(patientVisitData.patientId.lastname); 
                var data = querystring.stringify({
                    doctype: 'receipt',
                    cid: icount_cid,
                    user: icount_username,
                    pass: icount_password,
                    docnum: req.body.invoiceIssuedData.docnum,
                    client_name: client_name,
                    email_to: patientVisitData.patientId.email,
                    email_to_creator: userInfo.email,
                    email_subject: subject
                }, { encodeValuesOnly: true })


                var url = constantsObj.invoiceConfig.EMAIL_URL + data;
                console.log('Data:', url);
                https.get(url, function (response) {
                    var buffer = "",
                        data,
                        route;

                    response.on("data", function (chunk) {
                        buffer += chunk;
                    });

                    response.on("end", function (err) {
                        data = JSON.parse(buffer);
                        console.log('response:', data);
                        return res.json({ 'code': 200, status: 'success', "message": constantmsg.invoiceEmailedSuccess, "data": '' });
                    });
                });
            }        }).catch(function (err) {
            console.log(err, 'errrrrr');
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
}

/**
 * Function is add payment details to database
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 14-June-2017
 */
function addPaymentDetails(req, res) {
    console.log('----------------addPaymentDetails----------', req.body);
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let visitPaymentData = yield VisitPayment.findOne({ visitId: req.body.visitId });
        console.log("visitPaymentData", visitPaymentData);
        var newBillData = req.body.billList;
        //add test taken by property in each new triage test
        //newTriageData.forEach(function(obj) { obj.testTakenBy = userInfo._id; });
        console.log("newBillData", newBillData);
        if (visitPaymentData) {
            visitPaymentData.billList = newBillData;

            var billData = visitPaymentData.billList[visitPaymentData.billList.length - 1];
            console.log("billData", billData);
            var mainStage = '';
            if (billData && billData.paymentType !== "") {
                let patientVisitData = yield Visit.findById(req.body.visitId).populate('patientId');
                let patientData = yield Patient.findById(patientVisitData.patientId);
                if (patientData && billData.previousDebt !== 0) {
                    patientData.previousDebt = 0;
                    let savedData = yield patientData.save();
                }
                if (patientVisitData.visitIsClosed == 1) {
                    let completedStatus = yield Status.findOne({ id: constantsObj.statusId.COMPLETED }).lean();
                    patientVisitData.currentStatus = completedStatus.id;
                    patientVisitData.isPaymentDone = 1;
                    let savedVisitData = yield patientVisitData.save();
                    //update stage info
                    mainStage = completedStatus.id;
                }
            }
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'payment', mainStage, userInfo._id);
            stageData.mainStage = stageInfo.mainStage;
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            let savedVisitPaymentData = yield visitPaymentData.save();
            return res.json(Response(200, "success", constantmsg.paymentSavedSuccess, savedVisitPaymentData));
        } else {
            return res.json(Response(402, "failed", constantmsg.paymentSavedFailed));
        }
    }).catch(function (err) {
        console.log('error:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get payment details by visitID
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 14-June-2017
//  */
// function getPaymentDetailsByVisitId(req, res) {
//     co(function* () {
//         let userInfo = yield utility.getUserInfoByToken(req.headers);
//         let constantmsg= yield utility.language(userInfo);
//         var id = req.swagger.params.id.value;
//         let paymentInfo = yield VisitPayment.findOne({ visitId: id }).exec();
//         console.log("paymentInfo:----->", paymentInfo);
//         return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": paymentInfo });
//     }).catch(function (err) {
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
//     });
// }
// function getPaymentDetailsByVisitId(req, res) {
//     co(function* () {
//         var id = req.swagger.params.id.value;
//         let paymentInfo = yield VisitPayment.findOne({ visitId: id }).exec();
//         var visitPrice = 0;
//         var isCurrentDateInWeekend = false;
//         console.log("paymentInfo:----->", paymentInfo);
//         //Get current day kupat visit price
//         let visitInfo = yield Visit.findById(id).populate('patientId').lean().exec();
//         let visitInfoWithKupatDetails = yield Visit.populate(visitInfo, {
//             path: 'patientId.kupatCholim',
//             model: 'Kupat'
//         });

//         if (visitInfoWithKupatDetails.patientId && visitInfoWithKupatDetails.patientId.kupatCholim) {
//             console.log("-------------------------------------------->", visitInfoWithKupatDetails.patientId.kupatCholim);
//             var utcCurrentTime = moment.utc();
//             console.log("utcCurrentTime---->", utcCurrentTime);
//             var currentTime_Isreal = moment(utcCurrentTime).tz("Israel").format();
//             console.log("currentTime_Isreal---->", currentTime_Isreal);
//             var currentDayNumber = moment(currentTime_Isreal).day();
//             console.log("weekday currentTime_Isreal---->", currentDayNumber);

//             //1 check currentdate in default range
//             if (visitInfoWithKupatDetails.patientId.kupatCholim.weekendDayRange) {
//                 var defaultWeekendDayRange = visitInfoWithKupatDetails.patientId.kupatCholim.weekendDayRange;
//                 console.log("defaultWeekendDayRange--->", defaultWeekendDayRange);
//                 //'Friday: 07:00 - Sunday: 19:00',
//                 var defaultWeekendDayRange = (defaultWeekendDayRange).split("-");
//                 if (defaultWeekendDayRange[0] && defaultWeekendDayRange[1]) {
//                     var weekendstart = (defaultWeekendDayRange[0].trim()).split(" ");
//                     var weekendStartDay = weekendstart[0].substring(0, weekendstart[0].length - 1);
//                     console.log("weekendStartDay:--->", weekendStartDay);
//                     var dayStartNumber = utility.dayOfWeekAsInteger(weekendStartDay);
//                     console.log("dayNumber:--->", dayStartNumber);
//                     //----------------
//                     var weekendend = (defaultWeekendDayRange[1].trim()).split(" ");
//                     var weekendEndDay = weekendend[0].substring(0, weekendend[0].length - 1);
//                     console.log("weekendEndDay:--->", weekendEndDay);
//                     var dayEndNumber = utility.dayOfWeekAsInteger(weekendEndDay);
//                     console.log("dayNumber:--->", dayEndNumber);
//                     var daysIndexArray = utility.getDayIndexArray(dayStartNumber, dayEndNumber);
//                     console.log("daysIndexArray---->", daysIndexArray);
//                     if ((daysIndexArray.indexOf(currentDayNumber) > -1) || ( (currentDayNumber == dayStartNumber) && (currentDayNumber == dayEndNumber)) ) {
//                         console.log("-----It is in weekend range-----");
//                         //compare time
//                         var beginningTime = moment(weekendstart[1].trim() + " " + weekendstart[2].trim(), 'h:mma');
//                         console.log("-----beginningTime-----", beginningTime);
//                         var endTime = moment(weekendend[1].trim() + " " + weekendend[2].trim(), 'h:mma');
//                         console.log("-----endTime-----", endTime);
//                         var myTime = moment(moment(currentTime_Isreal), 'h:mma');
//                         console.log("-----myTime-----", myTime);
//                         if (myTime.isBefore(endTime) && myTime.isAfter(beginningTime)) {
//                             console.log('----Okay--------');
//                             isCurrentDateInWeekend = true;
//                             visitPrice = visitInfoWithKupatDetails.patientId.kupatCholim.weekendPrice;
//                         } else {
//                             console.log('---------Not Okay--------------');
//                         }
//                     }
//                 }
//             }

//             if (!isCurrentDateInWeekend) {
//                 //2. check currentdate in weekendpriceset
//                 var weekendPriceSet = visitInfoWithKupatDetails.patientId.kupatCholim.weekendPriceSet;
//                 console.log("weekendPriceSet--->", weekendPriceSet);
//                 weekendPriceSet.forEach(function (set) {
//                     console.log("weekendPriceSet ---> Set:--->", set);
//                     var weekendPriceSetRange = (set.dateRange).split("-");
//                     var startDateTime = utility.convertStringToDateObject((weekendPriceSetRange[0]).trim());
//                     var endDateTime = utility.convertStringToDateObject((weekendPriceSetRange[1]).trim());
//                     console.log("startDateTime-------->", startDateTime);
//                     console.log("endDateTime-------->", endDateTime);
//                     var isBetween = moment(currentTime_Isreal).isBetween(startDateTime, endDateTime);
//                     console.log("isBetween-------->", isBetween);
//                     if (isBetween) {
//                         visitPrice = set.price;
//                         isCurrentDateInWeekend = true;
//                     }
//                 });
//             }

//             if (!isCurrentDateInWeekend) {
//                 visitPrice = visitInfoWithKupatDetails.patientId.kupatCholim.price;
//             }
//         }
//         return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": { paymentInfo: paymentInfo, visitPrice: visitPrice } });
//     }).catch(function (err) {
//         console.log("err--->", err);
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
//     });
// }
function getPaymentDetailsByVisitId(req, res) {
    co(function* () {
        var id = req.swagger.params.id.value;
        let paymentInfo = yield VisitPayment.findOne({ visitId: id }).exec();  
        console.log("paymentInfo:----->", paymentInfo);
        //Get current day kupat visit price
        let visitInfo = yield Visit.findById(id).populate('patientId').lean().exec();
        let visitInfoWithKupatDetails = yield Visit.populate(visitInfo, {
            path: 'patientId.kupatCholim',
            model: 'Kupat'
        });
        var visitPrice = 0;
        //If patient not personnel of EMC
        if (visitInfoWithKupatDetails.patientId && visitInfoWithKupatDetails.patientId.isPersonnel == false) {
          visitPrice = getVisitPriceByKupatAndCurrentDay(visitInfoWithKupatDetails);
        }
        
        return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": { paymentInfo: paymentInfo, visitPrice: visitPrice } });
    }).catch(function (err) {
        console.log("err--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


function getVisitPriceByKupatAndCurrentDay(visitInfoWithKupatDetails) {
        var visitPrice = 0;
        var isCurrentDateInWeekend = false;
        if (visitInfoWithKupatDetails.patientId && visitInfoWithKupatDetails.patientId.kupatCholim) {
            console.log("-------------------------------------------->", visitInfoWithKupatDetails.patientId.kupatCholim);
            var utcCurrentTime = moment.utc();
            console.log("utcCurrentTime---->", utcCurrentTime);
            var currentTime_Isreal = moment(utcCurrentTime).tz("Israel").format();
            console.log("currentTime_Isreal---->", currentTime_Isreal);
            var currentDayNumber = moment(currentTime_Isreal).day();
            console.log("weekday currentTime_Isreal---->", currentDayNumber);

            //1 check currentdate in default range
            if (visitInfoWithKupatDetails.patientId.kupatCholim.weekendDayRange) {
                var defaultWeekendDayRange = visitInfoWithKupatDetails.patientId.kupatCholim.weekendDayRange;
                console.log("defaultWeekendDayRange--->", defaultWeekendDayRange);
                //'Friday: 07:00 - Sunday: 19:00',
                var defaultWeekendDayRange = (defaultWeekendDayRange).split("-");
                if (defaultWeekendDayRange[0] && defaultWeekendDayRange[1]) {
                    var weekendstart = (defaultWeekendDayRange[0].trim()).split(" ");
                    var weekendStartDay = weekendstart[0].substring(0, weekendstart[0].length - 1);
                    console.log("weekendStartDay:--->", weekendStartDay);
                    var dayStartNumber = utility.dayOfWeekAsInteger(weekendStartDay);
                    console.log("dayNumber:--->", dayStartNumber);
                    //----------------
                    var weekendend = (defaultWeekendDayRange[1].trim()).split(" ");
                    var weekendEndDay = weekendend[0].substring(0, weekendend[0].length - 1);
                    console.log("weekendEndDay:--->", weekendEndDay);
                    var dayEndNumber = utility.dayOfWeekAsInteger(weekendEndDay);
                    console.log("dayNumber:--->", dayEndNumber);
                    var daysIndexArray = utility.getDayIndexArray(dayStartNumber, dayEndNumber);
                    console.log("daysIndexArray---->", daysIndexArray);
                    if ((daysIndexArray.indexOf(currentDayNumber) > -1) || ( (currentDayNumber == dayStartNumber) && (currentDayNumber == dayEndNumber)) ) {
                        console.log("-----It is in weekend range-----");
                        //compare time
                        var beginningTime = moment(weekendstart[1].trim() + " " + weekendstart[2].trim(), 'h:mma');
                        console.log("-----beginningTime-----", beginningTime);
                        var endTime = moment(weekendend[1].trim() + " " + weekendend[2].trim(), 'h:mma');
                        console.log("-----endTime-----", endTime);
                        var myTime = moment(moment(currentTime_Isreal), 'h:mma');
                        console.log("-----myTime-----", myTime);
                        if (myTime.isBefore(endTime) && myTime.isAfter(beginningTime)) {
                            console.log('----Okay--------');
                            isCurrentDateInWeekend = true;
                            visitPrice = visitInfoWithKupatDetails.patientId.kupatCholim.weekendPrice;
                        } else {
                            console.log('---------Not Okay--------------');
                        }
                    }
                }
            }

            if (!isCurrentDateInWeekend) {
                //2. check currentdate in weekendpriceset
                var weekendPriceSet = visitInfoWithKupatDetails.patientId.kupatCholim.weekendPriceSet;
                console.log("weekendPriceSet--->", weekendPriceSet);
                weekendPriceSet.forEach(function (set) {
                    console.log("weekendPriceSet ---> Set:--->", set);
                    var weekendPriceSetRange = (set.dateRange).split("-");
                    var startDateTime = utility.convertStringToDateObject((weekendPriceSetRange[0]).trim());
                    var endDateTime = utility.convertStringToDateObject((weekendPriceSetRange[1]).trim());
                    console.log("startDateTime-------->", startDateTime);
                    console.log("endDateTime-------->", endDateTime);
                    var isBetween = moment(currentTime_Isreal).isBetween(startDateTime, endDateTime);
                    console.log("isBetween-------->", isBetween);
                    if (isBetween) {
                        visitPrice = set.price;
                        isCurrentDateInWeekend = true;
                    }
                });
            }

            if (!isCurrentDateInWeekend) {
                visitPrice = visitInfoWithKupatDetails.patientId.kupatCholim.price;
            }
        }
        return visitPrice;
};
/**
 * Function is use to check all bills for visit are paid
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 15-June-2017
 */
function checkVisitPaymentDone(req, res) {
    console.log("checkVisitPaymentDone: ");
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let paymentInfo = yield VisitPayment.findOne({ visitId: req.body.visitId }).exec();
        // console.log("paymentInfo:----->", paymentInfo);
        var isAllVisitBillPaid = true;
        if (paymentInfo.billList && paymentInfo.billList.length > 0) {
            for (var i = 0; i < paymentInfo.billList.length; i++) {
                if (paymentInfo.billList[i].isBillPayed == false) {
                    isAllVisitBillPaid = false;
                    break;
                }
            }
        }
        else {
            isAllVisitBillPaid = false;
        }
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": isAllVisitBillPaid });
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is use get patient debt details
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 15-June-2017
 */
function getPatientDebt(req, res) {
    console.log("getPatientDebt");
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let sort = utility.getSortObj(req.body);
        let count = parseInt(req.body.count ? req.body.count : 0);
        let skip = parseInt(req.body.count * (req.body.page - 1));
        var searchText = req.body.searchText;
        var condition = { visitIsClosed: 1, isPaymentDone: 0 };
        if (searchText != undefined && searchText != 'undefined') {
            condition.$or = [
                // { 'visitEnd': new RegExp(searchText, 'gi') },
                { 'visitReason': new RegExp(searchText, 'gi') },
                { 'patientInfo.city': new RegExp(searchText, 'gi') },
                { 'patientInfo.mobileNo': new RegExp(searchText, 'gi') },
                { 'patientInfo.firstname': new RegExp(searchText, 'gi') },
                { 'patientInfo.lastname': new RegExp(searchText, 'gi') },
                { 'patientInfo.kupatCholim.name': new RegExp(searchText, 'gi') }
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
        {
            $lookup: {
                from: "kupats",
                localField: "patientInfo.kupatCholim",
                foreignField: "_id",
                as: "patientInfo.kupatCholim"
            }
        },
        { $unwind: "$patientInfo.kupatCholim" },
        { $match: condition }
            , {
            $project: {
                visitEnd: 1,
                visitReason: 1,
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
        let debtList = yield Visit.aggregate(aggregate);
        for (var i = 0; i < debtList.length; i++) {
            debtList[i].visitEnd = moment(debtList[i].visitEnd).tz("Israel").format();
            debtList[i].patientInfo.firstname = utility.getDecryptText(debtList[i].patientInfo.firstname);
            debtList[i].patientInfo.lastname = utility.getDecryptText(debtList[i].patientInfo.lastname);
            debtList[i].patientInfo.mobileNo = utility.getDecryptText(debtList[i].patientInfo.mobileNo);
            debtList[i].patientInfo.city = utility.getDecryptText(debtList[i].patientInfo.city);
        }
        console.log("-----debtList----", debtList);
        var getCount = Visit.find(condition).count().exec();
        getCount.then(function (totalLength) {
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": debtList, "totalLength": totalLength });
        }).catch(function (err) {
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
    });
}

function visitbyId(req, res) {
  co(function* () {
        
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var id = req.swagger.params.id.value;
        let visitInfo = yield Visit.findById(id).populate('patientId').lean().exec();
        let patientData = yield Patient.findById(visitInfo.patientId).populate('familyDoctorId').populate('kupatCholim').lean().exec();
        patientData.visitId = visitInfo._id;
        var fieldNotToDecrypt = ['_id', 'familyDoctorId', 'kupatCholim', 'comment', 'fatherName', 'motherName', 'age', 'status', 'DOB', 'email', 'fileName', 'allergies', 'visitId', 'medicalHistory', 'isPersonnel'];
        utility.decryptedRecord(patientData, fieldNotToDecrypt, function (patientRecord) {
            console.log('patientRecord', patientRecord)
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": patientRecord });
        })
    }).catch(function (err) {
        console.log("err:", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


/**
 * Function is decrement patient waiting count
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-July-2017
 */
// function decrementPatientWaitCount(req, res) {
//     console.log('--------------------------decrementPatientWaitCount-----------------------');
//     co(function* () {
//         let userInfo = yield utility.getUserInfoByToken(req.headers);
//         let constantmsg= yield utility.language(userInfo);
//         console.log('userInfo------->', userInfo);
//         let patientVisitData = yield Visit.findById(req.body.visitId);
//         console.log('patientVisitData------->', patientVisitData);
//         console.log('decrementPatientWaitCount:----> userInfo------->', userInfo._id);
//         console.log('decrementPatientWaitCount:---->patientVisitData.refferedTo------->', patientVisitData.refferedTo);

//         if ((patientVisitData.refferedTo).toString() == (userInfo._id).toString()) {
//             if (userInfo.patientWaitingCount) {
//                 console.log('before userInfo.patientWaitingCount------------>', userInfo.patientWaitingCount);
//                 userInfo.patientWaitingCount = userInfo.patientWaitingCount - 1;
//                 let userInfoSavedData = yield userInfo.save();
//                 console.log('after userInfo.patientWaitingCount------------>', userInfoSavedData.patientWaitingCount);
//                 return res.json(Response(200, "success", constantmsg.visitReasonSuccess, {}));
//             }
//         }
//         else {
//             return res.json(Response(200, "success", constantmsg.visitReasonSuccess, {}));
//         }
//     }).catch(function (err) {
//         console.log('decrementPatientWaitCount err:', err);
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
//     });
// }
function decrementPatientWaitCount(req, res) {
    console.log('--------------------------decrementPatientWaitCount-----------------------');
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        console.log('userInfo------->', userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        console.log('patientVisitData------->', patientVisitData);
        console.log('decrementPatientWaitCount:----> userInfo------->', userInfo._id);
        console.log('decrementPatientWaitCount:---->patientVisitData.refferedTo------->', patientVisitData.refferedTo);

        if ((patientVisitData.refferedTo).toString() == (userInfo._id).toString()) {
            if (userInfo.patientWaitingCount) {
                console.log('before userInfo.patientWaitingCount------------>', userInfo.patientWaitingCount);
                userInfo.patientWaitingCount = userInfo.patientWaitingCount - 1;
                let userInfoSavedData = yield userInfo.save();
                console.log('after userInfo.patientWaitingCount------------>', userInfoSavedData.patientWaitingCount);
                return res.json(Response(200, "success", constantsObj.messages.visitReasonSuccess, {}));
            }
        }
        else if(patientVisitData.refferedTo){
            let userInfo = yield User.find( { _id : patientVisitData.refferedTo }).exec();
            if (userInfo.patientWaitingCount) {
                console.log('before userInfo.patientWaitingCount------------>', userInfo.patientWaitingCount);
                userInfo.patientWaitingCount = userInfo.patientWaitingCount - 1;
                let userInfoSavedData = yield userInfo.save();
                console.log('after userInfo.patientWaitingCount------------>', userInfoSavedData.patientWaitingCount);
                return res.json(Response(200, "success", constantsObj.messages.visitReasonSuccess, {}));
            }
        }
        else {
            return res.json(Response(200, "success", constantsObj.messages.visitReasonSuccess, {}));
        }
    }).catch(function (err) {
        console.log('decrementPatientWaitCount err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get allergies list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-july-2017
 */
function getAllergies(req, res) {
    co(function* () {
        let allergies = yield Allergy.find({}).exec();
        console.log("allergies---->", allergies);
        return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": allergies });
    }).catch(function (err) {
        return res.json({ code: 402, message: err, data: {} });
    });
}
/**
 * Function is use to add doctor Treatment
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-july-2017
 */
function addDoctorTreatment(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId);
        if (patientVisitData) {
            patientVisitData.course = req.body.course;
            patientVisitData.diagonosis = req.body.diagonosis;
            patientVisitData.internalReferralComments = req.body.internalReferralComments;
            let savedData = yield patientVisitData.save();
            let stageData = yield VisitStage.findOne({ visitId: req.body.visitId });
            var stageInfo = updateStageInfo(stageData, 'doctor_treatment', '', userInfo._id);
            stageData.stages = stageInfo.stages;
            let stageDataSaved = yield stageData.save();
            return res.json(Response(200, "success", constantmsg.DoctorTreatmentUpdatedSuccess, {}));
        } else {
            return res.json(Response(402, "failed", constantmsg.DoctorTreatmentUpdatedFailed, err));
        }
    }).catch(function (err) {
        console.log('addDoctorTreatment err:', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}