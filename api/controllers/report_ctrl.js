'use strict';

var mongoose = require('mongoose'),
    Patient = mongoose.model('Patient'),
    User = mongoose.model('User'),
    Visit = mongoose.model('VisitInfo'),
    TriagePatientTest = mongoose.model('TriagePatientTest'),
    PatientTest = mongoose.model('PatientTest'),
    Disease = mongoose.model('Disease'),
    Order = mongoose.model('Order'),
    VisitStage = mongoose.model('VisitStage'),
    ReportHistory = mongoose.model('ReportHistory'),
    Response = require('../lib/response.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    validator = require('validator'),
    utility = require('../lib/utility.js'),
    co = require('co'),
    async = require('async'),
    AuditLog = mongoose.model('AuditLog'),
    Excel = require('exceljs'),
    moment = require('moment-timezone'),
    fs = require('fs'),
    path = require('path'),
    xlsx = require('xlsx');


module.exports = {
    exportToExcel: exportToExcel,
    //Reports
    getVisitResultsReport: getVisitResultsReport,
    getCurrentDiseaseReport: getCurrentDiseaseReport,
    getInvChangesReport: getInvChangesReport,
    getDrugsGiveAwayReport: getDrugsGiveAwayReport,
    //History Reports
    getReportGeneratedHistory: getReportGeneratedHistory,
    downloadOrViewReport: downloadOrViewReport,
    getKupatCholimReport: getKupatCholimReport,
    showReport: showReport

};

/**
 * Function is use to get visit result report by daterange
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 05-June-2017
 */
function getVisitResultsReport(req, res) {
    console.log('--------getVisitResultsReport---------------');
    co(function* () {
        console.log('req.body:', req.body);
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        if (req.body.dateRange) {
            var date = req.body.dateRange.split("-");
            var start = new Date(date[0]);
            start.setDate(start.getDate() + 1);
            console.log('start', start);
            var end = new Date(date[1]);
            end.setDate(end.getDate() + 1);
            console.log('end', end);

            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));

            var query = { "visitEnd": { "$gte": start, "$lte": end }, 'visitIsClosed': 1 };
            console.log('query: ', query);
            let aggregate = [
                { $match: query },
                {
                    $group: {
                        _id: { name: "$treatmentResultType", refferedBy: "$refferedBy" },
                        refferedBys: { "$push": "$refferedBy" },
                        total: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: { name: "$_id.name" },
                        referBy: { $addToSet: { refferedBy: "$_id.refferedBy", sum: "$total" } }
                    }
                }
            ];
            var totalCount = 0;
            let totalList = yield Visit.aggregate(aggregate);
            if (totalList) {
                totalCount = totalList.length;
            }
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let visitResultData = yield Visit.aggregate(aggregate);
            var list = [];
            for (var i = 0; i < visitResultData.length; i++) {
                if (visitResultData[i]._id.name == 'External Referral') {
                    if (visitResultData[i].referBy) {
                        var referByList = visitResultData[i].referBy;
                        for (var j = 0; j < referByList.length; j++) {
                            list.push({ rtype: visitResultData[i]._id.name + '(' + referByList[j].refferedBy + ')', count: referByList[j].sum });
                        }
                    }
                }
                else {
                    if (visitResultData[i]._id && visitResultData[i].referBy[0]) {
                        list.push({ rtype: visitResultData[i]._id.name, count: visitResultData[i].referBy[0].sum })
                    }
                }
            }
            var fileName = '';
            if (visitResultData && visitResultData.length > 0) {
                var reportPath = path.resolve('./Reports/', constantsObj.reportType.VISIT_RESULT);
                let isReportDirExists = yield utility.fileExistCheck(reportPath);
                console.log("isReportDirExists: ", isReportDirExists);
                if (isReportDirExists === false) {
                    yield utility.mkdirp(reportPath);
                }
                fileName = yield generateExcel(constantsObj.reportType.VISIT_RESULT, list, userInfo, reportPath);
                var generatedExcelPath = path.resolve(reportPath, fileName);
                console.log('generatedExcelPath:', generatedExcelPath);
                let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.VISIT_RESULT });
                if (reportGenrationInfo) {
                    var updateInfo = updateReportsHistory(constantsObj.reportType.VISIT_RESULT, userInfo, fileName, reportGenrationInfo.reportInfo);
                    reportGenrationInfo.reportInfo = updateInfo;
                    let savedData = yield reportGenrationInfo.save();
                }
                else {
                    var current_time = moment();
                    current_time = current_time.tz("Israel").format();
                    current_time = moment(current_time);
                    var reportInfo = [];
                    reportInfo.push({
                        filename: fileName,
                        generatedBy: userInfo._id,
                        createdAt: current_time
                    });
                    let savedData = yield new ReportHistory({
                        "type": constantsObj.reportType.VISIT_RESULT,
                        "reportInfo": reportInfo
                    }).save();
                }
            }
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": { data: list, file: fileName, totalLength: totalCount } });
        }
    }).catch(function (err) {
        console.log('err:0', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
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
function updateReportsHistory(reportType, userInfo, fileName, reportInfo) {
    console.log('updateReportsHistory');
    if (fileName) {
        var current_time = moment();
        current_time = current_time.tz("Israel").format();
        current_time = moment(current_time);
        if (reportInfo) {
            reportInfo.push({
                filename: fileName,
                generatedBy: userInfo._id,
                createdAt: current_time
            });
        }
        return reportInfo;
    }
}

/**
 * Function is use to export visit result report to excel
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 05-June-2017
 */
// function generateExcel(reportType, list, userInfo, reportPath) {
//     console.log('--------generateExcel---------------', reportType);
    
//     return new Promise(function (resolve, reject) {
//         console.log('list:', list);
//         var workbook = new Excel.Workbook();

//         workbook.creator = userInfo.firstname + " " + userInfo.lastname;
//         var utcMoment = moment.utc();
//         var utcDate = new Date(utcMoment.format());
//         workbook.created = utcDate;
//         workbook.modified = utcDate;
//         workbook.lastPrinted = utcDate;
//         var sheet = workbook.addWorksheet(reportType);
//         if (reportType == constantsObj.reportType.VISIT_RESULT) {
//             sheet.columns = [
//                 { header: 'Visit Result', key: 'type', width: 32 },
//                 { header: '# Of Patients', key: 'count', width: 10 },
//             ];
//             for (var i = 0; i < list.length; i++) {
//                 sheet.addRow({ type: list[i].rtype, count: list[i].count });
//             }
//         }
//         else if (reportType == constantsObj.reportType.CURRENT_DISEASE) {
//             sheet.columns = [
//                 { header: 'Current Disease', key: 'name', width: 32 },
//                 { header: '# Of Patients', key: 'count', width: 10 },
//             ];
//             for (var i = 0; i < list.length; i++) {
//                 sheet.addRow({ name: list[i]._id, count: list[i].total });
//             }
//         }
//         else if (reportType == constantsObj.reportType.INV_CHANGE) {
//             sheet.columns = [
//                 { header: 'Changed by', key: 'changeBy', width: 32 },
//                 { header: 'Changed at', key: 'changeTime', width: 20 },
//                 { header: 'Quantity change', key: 'change', width: 10 },
//                 { header: 'Dosage', key: 'dosage', width: 15 },
//                 { header: 'Drug', key: 'name', width: 20 },
//             ];
//             for (var i = 0; i < list.length; i++) {
//                 console.log("Time:", (list[i].createdAt).toString());
//                 sheet.addRow({ changeBy: list[i].userInfo.firstname + ' ' + list[i].userInfo.lastname, changeTime: list[i].createdAt, change: list[i].modifiedDetails.quantityChange, dosage: list[i].modifiedDetails.dosage, name: list[i].modifiedDetails.drugName });
//             }
//         }
//         else if (reportType == constantsObj.reportType.DRUGS_GIVEAWAY) {
//             sheet.columns = [
//                 { header: 'Drug', key: 'drug', width: 32 },
//                 { header: 'Dosage', key: 'dosage', width: 20 },
//                 { header: 'Quantity gave', key: 'givenQuantity', width: 10 },
//             ];
//             for (var i = 0; i < list.length; i++) {
//                 sheet.addRow({ drug: list[i]._id.drugName, dosage: list[i]._id.dosage, givenQuantity: list[i].totalAmount });
//             }
//         }
//         else if (reportType == constantsObj.reportType.KUPAT_CHOLIM) {
//             sheet.columns = [
//                 { header: 'Feature', key: 'type', width: 32 },
//                 { header: '# Of Patients', key: 'total', width: 20 },
//             ];
//             console.log("List--->", list);
//             for (var i = 0; i < list.length; i++) {
//                 sheet.addRow({ type: list[i]._id, total: list[i].total });
//             }
//         }

//         var timestamp = new Date().getTime().toString();
//         console.log(timestamp);
//         var filename = timestamp + '.xlsx';

//         var filePath = path.resolve(reportPath, filename);
//         workbook.xlsx.writeFile(filePath).then(function () {
//             resolve(filename);
//         });
//     });
// }

function generateExcel(reportType, list, userInfo, reportPath) {
    console.log('--------generateExcel---------------', reportType);
    
    return new Promise(function (resolve, reject) {
        console.log('list:', list);
        var workbook = new Excel.Workbook();

        workbook.creator = userInfo.firstname + " " + userInfo.lastname;
        var utcMoment = moment.utc();
        var utcDate = new Date(utcMoment.format());
        workbook.created = utcDate;
        workbook.modified = utcDate;
        workbook.lastPrinted = utcDate;
        var sheet = workbook.addWorksheet(reportType);
        if (reportType == constantsObj.reportType.VISIT_RESULT) {
            sheet.columns = [
                { header: 'תוצאת ביקור', key: 'type', width: 32 },
                { header: '# Of Patients', key: 'count', width: 20 },
            ];
            for (var i = 0; i < list.length; i++) {
                sheet.addRow({ type: list[i].rtype, count: list[i].count });
            }
        }
        else if (reportType == constantsObj.reportType.CURRENT_DISEASE) {
            sheet.columns = [
                { header: 'מחלה נוכחית', key: 'name', width: 32 },
                { header: '# Of Patients', key: 'count', width: 20 },
            ];
            for (var i = 0; i < list.length; i++) {
                sheet.addRow({ name: list[i]._id, count: list[i].total });
            }
        }
        else if (reportType == constantsObj.reportType.INV_CHANGE) {
            sheet.columns = [
                { header: 'שונה ב', key: 'changeBy', width: 32 },
                { header: 'Changed at', key: 'changeTime', width: 20 },
                { header: 'Quantity change', key: 'change', width: 20 },
                { header: 'מינון', key: 'dosage', width: 20 },
                { header: 'תרופות', key: 'name', width: 20 },
            ];
            for (var i = 0; i < list.length; i++) {
                console.log("Time:", (list[i].createdAt).toString());
                sheet.addRow({ changeBy: list[i].userInfo.firstname + ' ' + list[i].userInfo.lastname, changeTime: list[i].createdAt, change: list[i].modifiedDetails.quantityChange, dosage: list[i].modifiedDetails.dosage, name: list[i].modifiedDetails.drugName });
            }
        }
        else if (reportType == constantsObj.reportType.DRUGS_GIVEAWAY) {
            sheet.columns = [
                { header: 'תרופות', key: 'drug', width: 32 },
                { header: 'מינון', key: 'dosage', width: 20 },
                { header: 'כמות שניתנה', key: 'givenQuantity', width: 20 },
            ];
            for (var i = 0; i < list.length; i++) {
                sheet.addRow({ drug: list[i]._id.drugName, dosage: list[i]._id.dosage, givenQuantity: list[i].totalAmount });
            }
        }
        // else if (reportType == constantsObj.reportType.KUPAT_CHOLIM) {
        //     sheet.columns = [
        //         { header: 'Feature', key: 'type', width: 32 },
        //         { header: '# Of Patients', key: 'total', width: 20 },
        //     ];
        //     console.log("List--->", list);
        //     for (var i = 0; i < list.length; i++) {
        //         sheet.addRow({ type: list[i]._id, total: list[i].total });
        //     }
        // }
        else if (reportType == constantsObj.reportType.KUPAT_CHOLIM) {
            sheet.columns = [
                { header: 'מספר זהות מטופל', key: 'patientId', width: 32 },
                { header: 'שם המטופל', key: 'patientName', width: 32 },
                { header: 'תאריך ביקור', key: 'visitDate', width: 32 },
                { header: 'תוצאת ביקור', key: 'treatmentResultType', width: 32 },
                { header: 'תשלום בתשלום', key: 'paymentPaid', width: 32 },
            ];
            console.log("List--->", list);
            for (var i = 0; i < list.length; i++) {
                sheet.addRow({ 
                    patientId: list[i].patientInfo.patientId, 
                    patientName: list[i].patientInfo.firstname, 
                    visitDate: list[i].visitStart,
                    treatmentResultType: list[i].treatmentResultType, 
                    paymentPaid: list[i].isPaymentDone ==1 ?'Paid':'Not Paid' });
            }
        }

        var timestamp = new Date().getTime().toString();
        console.log(timestamp);
        var filename = timestamp + '.xlsx';

        var filePath = path.resolve(reportPath, filename);
        workbook.xlsx.writeFile(filePath).then(function () {
            resolve(filename);
        });
    });
}

/**
 * Function is use to export excel version of generated excel file
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 16-June-2017
 */
function exportToExcel(req, res) {
    co(function* () {
        var idInfo = req.params.id;
        var parts = idInfo.split('_');
        var type = parts[0];
        var filename = parts[1];
        var reportDirPath = path.resolve('./Reports/', type);
        console.log("reportDirPath:", reportDirPath );
        var filePath = path.resolve(reportDirPath, filename);
        console.log("filePath:", filePath );
        var isFileExists = utility.fileExistCheck(filePath);
        if(isFileExists){
           res.download(filePath);
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get current disease report by daterange
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 06-June-2017
 */

//  let aggregate = [
//                 // Do the lookup matching
//                 { "$unwind": "$currentDisease" },
//                 {
//                     "$lookup": {
//                         "from": "diseases",
//                         "localField": "currentDisease",
//                         "foreignField": "_id",
//                         "as": "currentDiseaseObjects"
//                     }
//                 },
//                 { "$unwind": "$currentDiseaseObjects" },
//                 { $match: { "visitEnd": { "$gte": new Date("2017-05-02T00:00:00.000Z"), "$lte": new Date("2017-07-01T00:00:00.000Z") },
//                  'visitIsClosed': 1 } },
//                 {
//                     "$group": {
//                         "_id": "$currentDiseaseObjects.name",
//                         total: { $sum: 1 }
//                     }
//                 }
//             ];
            
//             Visit.aggregate(aggregate).then(function(data){
//                 console.log("data", data);
//             });


function getCurrentDiseaseReport(req, res) {
    console.log('--------getCurrentDiseaseReport---------------');
    co(function* () {
         let userInfo = yield utility.getUserInfoByToken(req.headers);
         let constantmsg= yield utility.language(userInfo);       
        if (req.body.dateRange) {
            var date = req.body.dateRange.split("-");
            var start = new Date(date[0]);
            start.setDate(start.getDate() + 1);
            console.log('start', start);
            var end = new Date(date[1]);
            end.setDate(end.getDate() + 1);
            console.log('end', end);

            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));
            var query = { "visitEnd": { "$gte": start, "$lte": end }, 'visitIsClosed': 1 };
            console.log('query: ', query);
            let check = yield Visit.find(query);
            console.log("check", check);
             let aggregate = [
                // Do the lookup matching
                { "$unwind": "$currentDisease" },
                {
                    "$lookup": {
                        "from": "diseases",
                        "localField": "currentDisease",
                        "foreignField": "_id",
                        "as": "currentDiseaseObjects"
                    }
                },
                { "$unwind": "$currentDiseaseObjects" },
                { $match: query },
                {
                    "$group": {
                        "_id": "$currentDiseaseObjects.name",
                        total: { $sum: 1 }
                    }
                }
            ];
            var totalCount = 0;
            let totalList = yield Visit.aggregate(aggregate);
            console.log("totalList", totalList);
            if (totalList) {
                totalCount = totalList.length;
            }
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let currentDiseaseData = yield Visit.aggregate(aggregate);
            console.log('currentDiseaseData:', currentDiseaseData);
            var fileName = '';
            if (currentDiseaseData && currentDiseaseData.length > 0) {
                var reportPath = path.resolve('./Reports/', constantsObj.reportType.CURRENT_DISEASE);
                let isReportDirExists = yield utility.fileExistCheck(reportPath);
                console.log("isReportDirExists: ", isReportDirExists);
                if (isReportDirExists === false) {
                    yield utility.mkdirp(reportPath);
                }
                fileName = yield generateExcel(constantsObj.reportType.CURRENT_DISEASE, currentDiseaseData, userInfo, reportPath);
                var generatedExcelPath = path.resolve(reportPath, fileName);
                console.log('generatedExcelPath:', generatedExcelPath);
                let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.CURRENT_DISEASE });
                if (reportGenrationInfo) {
                    var updateInfo = updateReportsHistory(constantsObj.reportType.CURRENT_DISEASE, userInfo, fileName, reportGenrationInfo.reportInfo);
                    reportGenrationInfo.reportInfo = updateInfo;
                    let savedData = yield reportGenrationInfo.save();
                }
                else {
                    var current_time = moment();
                    current_time = current_time.tz("Israel").format();
                    current_time = moment(current_time);
                    var reportInfo = [];
                    reportInfo.push({
                        filename: fileName,
                        generatedBy: userInfo._id,
                        createdAt: current_time
                    });
                    let savedData = yield new ReportHistory({
                        "type": constantsObj.reportType.CURRENT_DISEASE,
                        "reportInfo": reportInfo
                    }).save();
                }
            }
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": { data: currentDiseaseData, file: fileName, totalLength: totalCount, aggregate: aggregate } });
        }
    }).catch(function (err) {
        console.log('err:0', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}
// function getCurrentDiseaseReport(req, res) {
//     console.log('--------getCurrentDiseaseReport---------------');
//     co(function* () {
//         console.log('req.body:', req.body);
//         let userInfo = yield utility.getUserInfoByToken(req.headers);
//         if (req.body.dateRange) {
//             var date = req.body.dateRange.split("-");
//             var start = new Date(date[0]);
//             start.setDate(start.getDate() + 1);
//             console.log('start', start);
//             var end = new Date(date[1]);
//             end.setDate(end.getDate() + 1);
//             console.log('end', end);

//             let sort = utility.getSortObj(req.body);
//             let count = parseInt(req.body.count ? req.body.count : 0);
//             let skip = parseInt(req.body.count * (req.body.page - 1));
//             var query = { "visitEnd": { "$gte": start, "$lte": end }, 'visitIsClosed': 1 };
//             console.log('query: ', query);
//              let check = yield Visit.find(query);
//             console.log("check", check);
//             let aggregate = [
//                 { $match: query },
//                 // Do the lookup matching
//                 {
//                     "$lookup": {
//                         "from": "diseases",
//                         "localField": "currentDisease",
//                         "foreignField": "_id",
//                         "as": "currentDiseaseObjects"
//                     }
//                 },
//                  { "$unwind": "$currentDiseaseObjects" },
//                 {
//                     "$group": {
//                         "_id": "$currentDiseaseObjects.name",
//                         total: { $sum: 1 }
//                     }
//                 }
//             ]
//             var totalCount = 0;
//             let totalList = yield Visit.aggregate(aggregate);
//             console.log("totalList", totalList);
//             if (totalList) {
//                 totalCount = totalList.length;
//             }
//             if (skip > 0) {
//                 aggregate.push({ $skip: skip });
//             }
//             if (count > 0) {
//                 aggregate.push({ $limit: count });
//             }
//             if (sort) {
//                 aggregate.push({ $sort: sort });
//             }
//             let currentDiseaseData = yield Visit.aggregate(aggregate);
//             console.log('currentDiseaseData:', currentDiseaseData);
//             var reportPath = path.resolve('./Reports/', constantsObj.reportType.CURRENT_DISEASE);
//             let isReportDirExists = yield utility.fileExistCheck(reportPath);
//             console.log("isReportDirExists: ", isReportDirExists);
//             if (isReportDirExists === false) {
//                 yield utility.mkdirp(reportPath);
//             }
//             let fileName = yield generateExcel(constantsObj.reportType.CURRENT_DISEASE, currentDiseaseData, userInfo, reportPath);
//             var generatedExcelPath = path.resolve(reportPath, fileName);
//             console.log('generatedExcelPath:', generatedExcelPath);
//             let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.CURRENT_DISEASE });
//             if (reportGenrationInfo) {
//                 var updateInfo = updateReportsHistory(constantsObj.reportType.CURRENT_DISEASE, userInfo, fileName, reportGenrationInfo.reportInfo);
//                 reportGenrationInfo.reportInfo = updateInfo;
//                 let savedData = yield reportGenrationInfo.save();
//             }
//             else {
//                 var current_time = moment();
//                 current_time = current_time.tz("Israel").format();
//                 current_time = moment(current_time);
//                 var reportInfo = [];
//                 reportInfo.push({
//                     filename: fileName,
//                     generatedBy: userInfo._id,
//                     createdAt: current_time
//                 });
//                 let savedData = yield new ReportHistory({
//                     "type": constantsObj.reportType.CURRENT_DISEASE,
//                     "reportInfo": reportInfo
//                 }).save();
//             }
//             return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": { data: currentDiseaseData, file: fileName, totalLength: totalCount } });
//         }
//     }).catch(function (err) {
//         console.log('err:0', err);
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
//     });
// }
/**
 * Function is use to get inventory change report by daterange
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 07-June-2017
 */
function getInvChangesReport(req, res) {
    console.log('--------getInvChangesReport---------------');
    co(function* () {
        console.log('req.body:', req.body);
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        if (req.body.dateRange) {
            var date = req.body.dateRange.split("-");
            var start = new Date(date[0]);
            start.setDate(start.getDate() + 1);
            console.log('start', start);
            var end = new Date(date[1]);
            end.setDate(end.getDate() + 1);
            console.log('end', end);

            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));
            var condition = { "createdAt": { "$gte": start, "$lte": end }, 'actionSubName': 'InventoryChange' };
            let aggregate = [{
                $lookup: {
                    from: "users",
                    localField: "actionBy",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$modifiedDetails" },
            { $unwind: "$userInfo" },
            { $match: condition },
            {
                $project: {
                    createdAt: 1,
                    modifiedDetails: 1,
                    userInfo: '$userInfo'
                }
            }
            ];
            var totalCount = 0;
            let totalList = yield AuditLog.aggregate(aggregate);
            if (totalList) {
                totalCount = totalList.length;
            }
            console.log('getInvChangesReport COUNT:', totalCount);
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let invChangeList = yield AuditLog.aggregate(aggregate);
            console.log('invChangeList:', invChangeList);
            var fileName = '';
            if (invChangeList && invChangeList.length > 0) {
                var reportPath = path.resolve('./Reports/', constantsObj.reportType.INV_CHANGE);
                let isReportDirExists = yield utility.fileExistCheck(reportPath);
                console.log("isReportDirExists: ", isReportDirExists);
                if (isReportDirExists === false) {
                    yield utility.mkdirp(reportPath);
                }
                fileName = yield generateExcel(constantsObj.reportType.INV_CHANGE, invChangeList, userInfo, reportPath);
                var generatedExcelPath = path.resolve(reportPath, fileName);
                console.log('generatedExcelPath:', generatedExcelPath);
                let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.INV_CHANGE });
                if (reportGenrationInfo) {
                    var updateInfo = updateReportsHistory(constantsObj.reportType.INV_CHANGE, userInfo, fileName, reportGenrationInfo.reportInfo);
                    reportGenrationInfo.reportInfo = updateInfo;
                    let savedData = yield reportGenrationInfo.save();
                }
                else {
                    var current_time = moment();
                    current_time = current_time.tz("Israel").format();
                    current_time = moment(current_time);
                    var reportInfo = [];
                    reportInfo.push({
                        filename: fileName,
                        generatedBy: userInfo._id,
                        createdAt: current_time
                    });
                    let savedData = yield new ReportHistory({
                        "type": constantsObj.reportType.INV_CHANGE,
                        "reportInfo": reportInfo
                    }).save();
                }
            }
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": { data: invChangeList, file: fileName, totalLength: totalCount } });
        }
    }).catch(function (err) {
        console.log('err:0', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}




/**
 * Function is use to get drugs give away report by daterange
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 07-June-2017
 */
function getDrugsGiveAwayReport(req, res) {
    console.log('--------getDrugsGiveAwayReport---------------');
    co(function* () {
        console.log('req.body:', req.body);
        
         let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        if (req.body.dateRange) {
            var date = req.body.dateRange.split("-");
            var start = new Date(date[0]);
            start.setDate(start.getDate() + 1);
            console.log('start', start);
            var end = new Date(date[1]);
            end.setDate(end.getDate() + 1);
            console.log('end', end);
            var query = { "updatedAt": { "$gte": start, "$lte": end } };
            console.log('query: ', query);
            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));
            let aggregate = [
                { $match: query },
                { "$unwind": "$emcOrder" },
                {
                    "$group": {
                        "_id": {
                            "dosage": "$emcOrder.dosage",
                            "drugName": "$emcOrder.drugName"
                        },
                        totalAmount: { $sum: "$emcOrder.givenAmount" },
                        "count": { "$sum": 1 }
                    }
                },
            ];
            var totalCount = 0;
            let totalList = yield Order.aggregate(aggregate);
            if (totalList) {
                totalCount = totalList.length;
            }
            console.log('totalCount:', totalCount);
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let giveAwayData = yield Order.aggregate(aggregate);
            console.log('giveAwayData: ', giveAwayData);
            var fileName = '';
            if (giveAwayData && giveAwayData.length > 0) {
            var reportPath = path.resolve('./Reports/', constantsObj.reportType.DRUGS_GIVEAWAY);
            let isReportDirExists = yield utility.fileExistCheck(reportPath);
            console.log("isReportDirExists: ", isReportDirExists);
            if (isReportDirExists === false) {
                yield utility.mkdirp(reportPath);
            }
            fileName = yield generateExcel(constantsObj.reportType.DRUGS_GIVEAWAY, giveAwayData, userInfo, reportPath);
            var generatedExcelPath = path.resolve(reportPath, fileName);
            console.log('generatedExcelPath:', generatedExcelPath);
            let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.DRUGS_GIVEAWAY });
            if (reportGenrationInfo) {
                var updateInfo = updateReportsHistory(constantsObj.reportType.DRUGS_GIVEAWAY, userInfo, fileName, reportGenrationInfo.reportInfo);
                reportGenrationInfo.reportInfo = updateInfo;
                let savedData = yield reportGenrationInfo.save();
            }
            else {
                var current_time = moment();
                current_time = current_time.tz("Israel").format();
                current_time = moment(current_time);
                var reportInfo = [];
                reportInfo.push({
                    filename: fileName,
                    generatedBy: userInfo._id,
                    createdAt: current_time
                });
                let savedData = yield new ReportHistory({
                    "type": constantsObj.reportType.DRUGS_GIVEAWAY,
                    "reportInfo": reportInfo
                }).save();
            }
            }
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": { data: giveAwayData, file: fileName, totalLength: totalCount } });
        }
    }).catch(function (err) {
        console.log('err:0', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get history if reports generated
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 08-June-2017
 */
function getReportGeneratedHistory(req, res) {
    console.log('--------getReportGeneratedHistory---------------');
    co(function* () {
        console.log('req.body:', req.body);
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        if (req.body.reportType) {
            var query = { "type": req.body.reportType };
            console.log('query: ', query);
            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));
            let aggregate = [
                { $match: query },
                { "$unwind": "$reportInfo" },
                {
                    $lookup: {
                        from: "users",
                        localField: "reportInfo.generatedBy",
                        foreignField: "_id",
                        as: "userInfo"
                    }
                },
                { "$unwind": "$userInfo" },
                {
                    $project: {
                        reportInfo: '$reportInfo',
                        firstname: "$userInfo.firstname",
                        lastname: "$userInfo.lastname"
                    }
                }
            ];
            var totalCount = 0;
            let totalList = yield ReportHistory.aggregate(aggregate);
            if (totalList) {
                totalCount = totalList.length;
            }

            console.log('totalCount:', totalCount);
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let list = yield ReportHistory.aggregate(aggregate);
            console.log('list: ', list.length);
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": list, "totalLength": totalCount });
        }
    }).catch(function (err) {
        console.log('err:0', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}


function getKupatCholimReport(req, res) {
    console.log('--------getKupatCholimReport---------------');
    co(function* () {
        console.log('req.body:', req.body);
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        if (req.body.dateRange) {
            var date = req.body.dateRange.split("-");
            var start = new Date(date[0]);
            start.setDate(start.getDate() + 1);
            console.log('start', start);
            var end = new Date(date[1]);
            end.setDate(end.getDate() + 1);
            console.log('end', end);
           var query = { "visitEnd": { "$gte": start, "$lte": end } , 'visitIsClosed': 1, 'patientInfo.kupatCholim': { $eq: mongoose.Types.ObjectId(req.body.kupatKholim)}};
            let sort = utility.getSortObj(req.body);
            let count = parseInt(req.body.count ? req.body.count : 0);
            let skip = parseInt(req.body.count * (req.body.page - 1));
            let aggregate = [
               {
                    $lookup: {
                        from: "patients",
                        localField: "patientId",
                        foreignField: "_id",
                        as: "patientInfo"
                    }
                },
                { $unwind: "$patientInfo" },
                {  $match: query  },
               
            ];
 
           let totalList = yield Visit.aggregate(aggregate);
            if (skip > 0) {
                aggregate.push({ $skip: skip });
            }
            if (count > 0) {
                aggregate.push({ $limit: count });
            }
            if (sort) {
                aggregate.push({ $sort: sort });
            }
            let kupatCholimReportData = yield Visit.aggregate(aggregate);
            console.log("kupatCholimReportData--->", kupatCholimReportData);
            if (kupatCholimReportData) {
            for (var i = 0; i < kupatCholimReportData.length; i++) 
            {
                kupatCholimReportData[i].patientInfo.firstname = utility.getDecryptText(kupatCholimReportData[i].patientInfo.firstname);
                kupatCholimReportData[i].patientInfo.patientId = utility.getDecryptText(kupatCholimReportData[i].patientInfo.patientId);
             }
            }
            var fileName = '';
            if (kupatCholimReportData && kupatCholimReportData.length > 0) {
            var reportPath = path.resolve('./Reports/', constantsObj.reportType.KUPAT_CHOLIM);
            let isReportDirExists = yield utility.fileExistCheck(reportPath);
            if (isReportDirExists === false) {
                yield utility.mkdirp(reportPath);
            }
             fileName = yield generateExcel(constantsObj.reportType.KUPAT_CHOLIM, kupatCholimReportData, userInfo, reportPath);
          
            var generatedExcelPath = path.resolve(reportPath, fileName);
            let reportGenrationInfo = yield ReportHistory.findOne({ type: constantsObj.reportType.KUPAT_CHOLIM });
            if (reportGenrationInfo) {
                var updateInfo = updateReportsHistory(constantsObj.reportType.KUPAT_CHOLIM, userInfo, fileName, reportGenrationInfo.reportInfo);
                reportGenrationInfo.reportInfo = updateInfo;
                
                let savedData = yield reportGenrationInfo.save();
            }
            else {
                var current_time = moment();
                current_time = current_time.tz("Israel").format();
                current_time = moment(current_time);
                var reportInfo = [];
                reportInfo.push({
                    filename: fileName,
                    generatedBy: userInfo._id,
                    createdAt: current_time
                });
                let savedData = yield new ReportHistory({
                    "type": constantsObj.reportType.KUPAT_CHOLIM,
                    "reportInfo": reportInfo
                }).save();
            }
            }
          
            return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": { data: kupatCholimReportData, file: fileName } });
        }
    }).catch(function (err) {
        console.log('getKupatCholimReport', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

function downloadOrViewReport(req, res) {
    co(function* () {
        var idInfo = req.params.id;
        var parts = idInfo.split('_');
        var type = parts[0];
        var fileId = parts[1];
        var fileName = '';
        //filename by id
        let reportsList = yield ReportHistory.findOne({ type: type }).exec();
        if (reportsList && reportsList.reportInfo && reportsList.reportInfo.length > 0) {
            var reportInfo = reportsList.reportInfo;
            for(var i = 0 ; i < reportInfo.length; i++){
                if(reportInfo[i]._id == fileId){
                    fileName = reportInfo[i].filename;
                }
            }
            var reportDirPath = path.resolve('./Reports/', type);
            console.log("reportDirPath:", reportDirPath);
            var filePath = path.resolve(reportDirPath, fileName);
            console.log("filePath:", filePath);
            var isFileExists = utility.fileExistCheck(filePath);
            if (isFileExists) {
                res.download(filePath);
            }
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}


/**
 * Function is to show report as html page
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 8-July-2017
 */
function showReport(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var idInfo = req.swagger.params.id.value;
        var parts = idInfo.split('_');
        var type = parts[0];
        var fileId = parts[1];

        var fileName = '';
        //filename by id
        let reportsList = yield ReportHistory.findOne({ type: type }).exec();
        if (reportsList && reportsList.reportInfo && reportsList.reportInfo.length > 0) {
            var reportInfo = reportsList.reportInfo;
            for (var i = 0; i < reportInfo.length; i++) {
                if (reportInfo[i]._id == fileId) {
                    fileName = reportInfo[i].filename;
                }
            }
            var reportDirPath = path.resolve('./Reports/', type);
            console.log("reportDirPath:", reportDirPath);
            var filePath = path.resolve(reportDirPath, fileName);
            console.log("filePath:", filePath);

            var isFileExists = utility.fileExistCheck(filePath);
            if (isFileExists) {
                var workbook = xlsx.readFile(filePath);
                console.log("workbook---->", workbook);
                var result = [];
                workbook.SheetNames.forEach(function (sheetName) {
                    console.log("sheetName--->", sheetName);
                    var html = xlsx.utils.sheet_to_html(workbook.Sheets[sheetName]);
       
                    console.log("----------------------->html--------------->", html);
                    return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": { html} });
                });
            }
            else {
                 return res.json({ 'code': 402, status: 'failed', "message": constantmsg.dataRetrievedSuccess });
            }
        }
        else {
           return res.json({ 'code': 402, status: 'failed', "message": constantmsg.dataRetrievedSuccess });
        }
    }).catch(function (err) {
        console.log("showReport error--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}













