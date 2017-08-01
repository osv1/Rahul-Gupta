'use strict';

var mongoose = require('mongoose'),
    Inventory = mongoose.model('Inventory'),
    Response = require('../lib/response.js'),
    formidable = require('formidable'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    utility = require('../lib/utility.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    validator = require('validator'),
    async = require('async'),
    AuditLogController = require('./auditlog_ctrl'),
    AuditLog = mongoose.model('AuditLog'),
    co = require('co'),
    Excel = require('exceljs'),
    moment = require('moment-timezone');

 module.exports = {
    addNewDrug: addNewDrug,
    getDrugList: getDrugList,
    getDrugs:getDrugs,
    deleteDrug:deleteDrug,
    exportToExcelInvList : exportToExcelInvList
};

/**
 * Function is use to getDrugList 
 * @access private
 * @return json
 * Created by sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 17-May-2017
 */
function addNewDrug(req, res) {
  console.log("addNewDrug-------------->", req.body );
  co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    let addDrugData = yield Inventory.findById(req.body._id);
    if (addDrugData) {
      var found = 0;
      var dosageList = addDrugData.drugDetails;
      var modifiedDetails = [];
      for (var i = 0; i < dosageList.length; i++) {
        if (dosageList[i]._id == req.body.drugDetails._id) {
          var fieldChange = {};
          var quantityChange = '';
          if (req.body.drugDetails.quantity > dosageList[i].quantity) {
            quantityChange = '+' + (req.body.drugDetails.quantity - dosageList[i].quantity).toString();
          }
          else {
            quantityChange = '-' + (dosageList[i].quantity - req.body.drugDetails.quantity).toString();
          }
          dosageList[i].quantity = req.body.drugDetails.quantity;
          dosageList[i].updateQuantity = req.body.drugDetails.updateQuantity;
          addDrugData.drugDetails = dosageList;
          fieldChange = {
            drugName: addDrugData.drugName,
            dosage: dosageList[i].dosage,
            quantityChange: quantityChange
          }
          modifiedDetails.push(fieldChange);
          found++;
          break;
        }
      }
      if (found == 0) {
        addDrugData.drugDetails.push(req.body.drugDetails);
      }
      console.log("addDrugData-------------->", addDrugData);
      let savedData = yield addDrugData.save();
      let savedAuditLogData = yield AuditLogController.addAuditLog("Inventory", userInfo._id, "Edit", "InventoryChange", modifiedDetails);
      return res.json(Response(200, "success", constantmsg.drugAddedSuccess, {}));
    } else if (!addDrugData) {
      var inventory = new Inventory(req.body);
      inventory.save(function (err, drug) {
        if (err) {
          res.json({
            code: 404,
            message: utility.validationErrorHandler(err)
          });
        } else {
          res.json({
            code: 200,
            message: constantmsg.drugAddedSuccess,
            data: drug
          });
        }
      });
    } else {
      return res.json(Response(402, "failed", constantmsg.drugAddedFailed));
    }
  }).catch(function (err) {
    console.log("ERR:", err);
    return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
  });
}
// function addNewDrug(req, res) {
//     var drugDetails;
//     var check=0;
//     co(function*() {
//         let addDrugData = yield Inventory.findById(req.body._id);
//         if (addDrugData) {
//             var  dosageList = addDrugData.drugDetails;
//             for(var i = 0 ; i < dosageList.length; i++){
//                if(dosageList[i]._id == req.body.drugDetails._id ){
//                     console.log(dosageList[i]);
//                     dosageList[i].quantity=req.body.drugDetails.quantity;
//                     addDrugData.drugDetails = dosageList;
//                     console.log(" after ", addDrugData.drugDetails);
//                     check++;
//                     break;
//                }
//             }
//             if(check == 0){
//               addDrugData.drugDetails.push(req.body.drugDetails); 
//             }                 
//             console.log(addDrugData.drugDetails);
//             let savedData = yield addDrugData.save();
//             return res.json(Response(200, "success", constantsObj.messages.drugAddedSuccess, {}));
//         } else  if(!addDrugData){
//             var inventory = new Inventory(req.body);
//             inventory.save(function (err, drug) {
//             if (err) {
//               console.log(err);
//               res.json({
//               code: 404,
//               message: utility.validationErrorHandler(err)
//             })
//             } else {
//               res.json({
//               code: 200,
//               message: constantsObj.messages.drugAddedSuccess,
//               data: drug
//             })
//             }
//            })
//         }else{
//       return res.json(Response(402, "failed", constantsObj.validationMessages.drugAddedFailed, err));
//     }
//     }).catch(function(err) {
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
//     });
// } 

//  function getDrugList(req, res) {
//   console.log("getDrugList");
//   var count = req.query.count ? req.query.count : 0;
//   var skip = req.query.count * (req.query.page - 1);
//   var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
//   var condition={ };
//   var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
//   if (req.query.searchText) {
//     condition.$or = [{ 'drugName': new RegExp(searchText, 'gi')},{ 'dosage': new RegExp(searchText, 'gi')},{ 'quantity': new RegExp(searchText, 'gi')}];
//   }
//   Inventory.find(condition, {})
//     .limit(parseInt(count))
//     .skip(parseInt(skip))
//     .sort(sorting)
//     .lean()
//     .exec(function (err, result) {
//       if (err) {
//         return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
//       } else {
//         var getCount = Inventory.find(condition).count().exec();
//         getCount.then(function (totalLength) {
//           return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": result, "totalLength": totalLength });
//         }).catch(function (err) {
//           return res.json({ 'code': 500, status: 'failure', "message": constantsObj.messages.errorRetreivingData, "data": err });
//         });
//       }
//     });
// }
/**
 * Function is use to getDrugList 
 * @access private
 * @return json
 * Created by sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 16-May-2017
 */

function getDrugList(req, res) {
  console.log("getDrugList");
  co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
    for (var key in sorting) {
      var value = sorting[key];
      sorting[key] = (value == 'desc') ? -1 : 1;
    }
    let count = parseInt(req.query.count ? req.query.count : 0);
    let skip = parseInt(req.query.count * (req.query.page - 1));
    var searchText = req.query.searchText;
    var condition = {};
    var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
    console.log("searchtext", searchText);
    if (req.query.searchText) {
      condition.$or = [
        { 'drugName': new RegExp(searchText, 'gi') },
        { 'drugDetails.dosage': new RegExp(searchText, 'gi') },
        { 'drugDetails.updateQuantity': new RegExp(searchText, 'gi') },
        { 'drugDetails.quantity': new RegExp(searchText, 'gi') }];
    }
    let aggregate = [
      { $match: condition },
      { $unwind: "$drugDetails" },
      {
        $project: {
          drugName: 1,
          drugDetails: '$drugDetails'
        }
      }
    ];
    if (skip > 0) {
      aggregate.push({ $skip: skip });
    }
    if (count > 0) {
      aggregate.push({ $limit: count });
    }
    if (sorting) {
      aggregate.push({ $sort: sorting });
    }
    let inventoryList = yield Inventory.aggregate(aggregate);

     let aggregateCount = [
      { $match: condition },
      { $unwind: "$drugDetails" },
      {
        $project: {
          drugName: 1,
          drugDetails: '$drugDetails'
        }
      }
    ];
    let list = yield Inventory.aggregate(aggregateCount);
    var drugCount = list.length;
    console.log('drugCount:', drugCount);
     console.log('Drug List:--->:', list);
    return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": inventoryList, "totalLength": drugCount});
  }).catch(function (err) {
    return res.json({ 'code': 500, status: 'failure', "message": constantmsg.errorRetreivingData, "data": err });
  });
}


/**
 * Function is use to getDrugList 
 * @access private
 * @return json
 * Created by sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 16-May-2017
 */

function getDrugs(req, res) {
  co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    Inventory.find({}).exec(function (err, result) {
    if (err) {
                res.json({
                            code: 404,
                            message: constantmsg.errorRetreivingData
                        })
             } else if (result && result.length) {
                res.json({
                            code: 200,
                            message: constantmsg.dataRetrievedSuccess,
                            data: result
                        })
            } else {
                res.json({
                            code: 200,
                            message: constantmsg.noDataFound
                        })
            }
  })
  }).catch(function (err) {
      return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to getDrugList 
 * @access private
 * @return json
 * Created by sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 17-May-2017
 */
function deleteDrug(req, res) {
    var id = req.swagger.params.id.value;
    var drugDetailId = req.swagger.params.to.value;
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let addDrugData = yield Inventory.findById(id);
        if (addDrugData) {
            var  dosageList = addDrugData.drugDetails;
            if(dosageList.length>1){
            for(var i = 0 ; i < dosageList.length; i++){
               if(dosageList[i]._id == drugDetailId ){
                    addDrugData.drugDetails.pull(dosageList[i]);
                    let savedData = yield addDrugData.save();
                 
                    return res.json(Response(200, "success", constantmsg.drugDeletedSuccess, {}));
                    
                    break;
               }
               
            } 
          }else{
           let savedData = yield addDrugData.remove()     
           return res.json(Response(200, "success", constantmsg.drugDeletedSuccess, {}));
           } 
        }else{
      return res.json(Response(402, "failed", constantmsg.drugDeletedFailed, err));
    }
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
} 

function exportToExcelInvList(req, res) {
  co(function* () {
    var condition = {};
    let aggregate = [
      { $match: condition },
      { $unwind: "$drugDetails" },
      {
        $project: {
          drugName: 1,
          drugDetails: '$drugDetails'
        }
      }
    ];
    let inventoryList = yield Inventory.aggregate(aggregate);
    var drugCount = inventoryList.length;
    console.log("inventoryList: ", inventoryList);
    console.log("drugCount: ", drugCount);

    var reportPath = path.resolve('./Reports/', constantsObj.reportType.INVENTORY);
    let isReportDirExists = yield utility.fileExistCheck(reportPath);
    console.log("isReportDirExists: ", isReportDirExists);
    if (isReportDirExists === false) {
      yield utility.mkdirp(reportPath);
    }
    let fileName = yield generateExcel(constantsObj.reportType.INVENTORY, inventoryList, reportPath);
    var generatedExcelPath = path.resolve(reportPath, fileName);
    console.log('generatedExcelPath:', generatedExcelPath);
   // return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": { file: fileName } });
    var isFileExists = utility.fileExistCheck(generatedExcelPath);
        if(isFileExists){
           res.download(generatedExcelPath);
     }
  }).catch(function (err) {
    console.log("err-->", err);
    return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
  });
}

/**
 * Function is use to export visit result report to excel
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 05-June-2017
 */
function generateExcel(reportType, list, reportPath) {
    console.log('--------generateExcel---------------', reportType);
    return new Promise(function (resolve, reject) {
        console.log('list:', list);
        var workbook = new Excel.Workbook();
        //Set Workbook Properties
        workbook.creator = "";
        var utcMoment = moment.utc();
        var utcDate = new Date(utcMoment.format());
        workbook.created = utcDate;
        workbook.modified = utcDate;
        workbook.lastPrinted = utcDate;
        var sheet = workbook.addWorksheet(reportType);
        if (reportType == constantsObj.reportType.INVENTORY) {
            sheet.columns = [
                { header: 'Drugs', key: 'drugName', width: 32 },
                { header: 'Dosage', key: 'dosage', width: 30 },
                { header: 'Quantity In Stock', key: 'quantity', width: 30 },
                { header: 'Target Quantity', key: 'targetQuantity', width: 30 },
            ];
            for (var i = 0; i < list.length; i++) {
                sheet.addRow({ drugName: list[i].drugName, dosage: list[i].drugDetails.dosage, quantity: list[i].drugDetails.quantity, targetQuantity: list[i].drugDetails.updateQuantity });
            }
        }

        var timestamp = new Date().getTime().toString(); // current time as number
        console.log(timestamp);
        var filename = timestamp + '.xlsx';

        var filePath = path.resolve(reportPath, filename);
        workbook.xlsx.writeFile(filePath).then(function () {
            resolve(filename);
        });
    });
}