'use strict';

var mongoose = require('mongoose'),
    Disease= mongoose.model('Disease'),
    Response = require('../lib/response.js'),
    formidable = require('formidable'),
    Triage = mongoose.model('Triage'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    utility = require('../lib/utility.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    async = require('async'), 
    Visit = mongoose.model('VisitInfo'),
    co = require('co');
    
module.exports = {
    addnewdisease: addnewdisease,
    addIndex: addIndex,
    getalldisease: getalldisease,
    getdiseasebyId: getdiseasebyId,
    getNurseTests: getNurseTests,
    getDoctorTests: getDoctorTests,
    getAllIndex: getAllIndex,
    addNewTriage: addNewTriage,
    getIndexTitleList: getIndexTitleList,
    getTriagebyId:getTriagebyId,
    deletediseasebyId: deletediseasebyId,
    updatetest: updatetest
};
/**
 * Function is use to Add Disease
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 15-Apr-2017
 */
function addnewdisease(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    if (!req.body.name) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else {
        var disease = new Disease(req.body);
        disease.save(function (err, disease) {
            if (err) {
                res.json({code: 404, message: utility.validationErrorHandler(err) })
            } else {
                res.json({ code: 200,message : constantmsg.DiseaseSuccess,data: disease})
            }})
        }
     })
  .catch(function (err) {
   return res.json({ code: 402, message: err, data: {} });
  })
}
/**
 * Function is use to get all disease
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 17-Apr-2017
 */

function getalldisease(req, res) {
 co(function* () {
  let userInfo = yield utility.getUserInfoByToken(req.headers);
  let constantmsg= yield utility.language(userInfo);
  var count = req.query.count ? req.query.count : 0;
  var skip = req.query.count * (req.query.page - 1);
  var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
  var condition = {};
  var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
  if (req.query.searchText) {
    condition.$or = [{ 'name': new RegExp(searchText, 'gi') }, { 'nurseTest': new RegExp(searchText, 'gi') }, { 'doctorTest': new RegExp(searchText, 'gi') }];
  }
  
  Disease.find(condition, {})
    .limit(parseInt(count))
    .skip(parseInt(skip))
    .sort(sorting)
    .lean()
    .exec(function (err, userData) {
      if (err) {
        return res.json(Response(500, "failed", constantmsg.internalError, err));
      } else {
        var getCount = Disease.find(condition).count().exec();
        getCount.then(function (totalLength) {
          return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": userData, "totalLength": totalLength });
        }) }
    });
})
.catch(function (err) {
          return res.json({ 'code': 500, status: 'failure', "message": constantmsg.errorRetreivingData, "data": err });
        });
}


/**
 * Function is use to get disease by id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 18-Apr-2017
 */
function getdiseasebyId(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var diseaseid = req.swagger.params.id.value;
    Disease.findById({_id:diseaseid}).exec(function(err, disease) {
        if (err) {
            res.json({code: 404,message: constantmsg.errorRetreivingData });
        } else if(disease){
            res.json({ code: 200, message: constantmsg.dataRetrievedSuccess, data: disease})
        }else{
            res.json({ code:400, message:constantmsg.noDataFound}) 
        }
    })
})
.catch(function(err) {
         return res.json({ code: 402, message: err, data: {} });
    })
}

/**
 * Function is use to delete disease
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 20-Apr-2017
 */
 function deletediseasebyId(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    Disease.remove({
        _id: req.swagger.params.id.value
    }).exec(function(err, disease) {
        if (err) {
            res.json({code: 404, message: constantmsg.errorRetreivingData });
        } else if(disease){
            res.json({ code: 200, message: constantmsg.diseaseDeleteSuccess, data: disease})
        }else{
           res.json({ code:400, message:constantmsg.noDataFound})}
    })
  }).catch(function(err) {
        return res.json({ code: 402, message: err, data: {} });
    })
 }

/**
 * Function is use to Update test
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 22-Apr-2017
 */
function updatetest(req,res){
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    if (!req.body.nurseTest || !req.body.doctorTest) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else {
    Disease.update({ '_id': req.body.id}, { $set: req.body}).exec(function(err,disease){
        if(err){
            res.json({code:404, message: utility.validationErrorHandler(err)})
     }else{
            res.json({code:200, message:constantmsg.updatetestSuccess})}})
          }
     }).catch(function(err) {
        return res.json({ code: 402, message: err, data: {} });
    })
  }

/**
 * Function is use to Add Index
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 24-Apr-2017
 */             
function addIndex(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    if (!req.body.alertFreqency) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else if(req.body.indexType == 'Triage'){
        Triage.update({'_id': req.body._id }, { $set: req.body }).exec(function (err, triage) {
                if (err) {
                    res.json({code: 404, message: utility.validationErrorHandler(err)})
                } else {
                    res.json({  code: 200,  message: constantmsg.indexUpdatedSuccess,data: triage })
                }
            })
            }else if(req.body.indexType == 'Disease'){
                Disease.update({ '_id': req.body._id}, { $set: req.body }).exec(function (err, disease) {
                if (err) {res.json({ code: 404, message: utility.validationErrorHandler(err)
                })
                } else {
                    res.json({code: 200,
                        message: constantmsg.indexUpdatedSuccess,data: disease }) }
            })
         }
      }).catch(function (err) {
                return res.json({ code: 402, message: err, data: {} });
            })
    }

/**
 * Function is use to get all index list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 27-April-2017
 */
function getAllIndex(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let diseaseIndexList = yield Disease.find({ alertFreqency: {  $exists : true , $ne: 0 } }).exec();
        let traigeIndexList =  yield Triage.find({ alertFreqency: { $exists : true , $ne: 0 } }).exec();

        for(var i = 0 ; i < traigeIndexList.length; i++){
             diseaseIndexList.push(traigeIndexList[i]);
        }
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": diseaseIndexList});
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is to get all nurse test for diseaseids array
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 24-April-2017
 */
//input: visitId
//All test of disease
function getNurseTests(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId).exec();
        var diseaseIds = patientVisitData.currentDisease;
        var nurseTest = [];
        for(var i = 0; i < diseaseIds.length; i++){
            var diseaseData = yield Disease.findById(diseaseIds[i]);
             for(var j = 0; j < diseaseData.nurseTest.length; j++){
                 nurseTest.push(diseaseData.nurseTest[j]);
             }
        }
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": nurseTest});
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is to get all doctor test for diseaseids array
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
//input: visitId
//All test of disease
function getDoctorTests(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let patientVisitData = yield Visit.findById(req.body.visitId).exec();
        var diseaseIds = patientVisitData.currentDisease;
        var doctorTest = [];
        for(var i = 0; i < diseaseIds.length; i++){
            
            var diseaseData = yield Disease.findById(diseaseIds[i]);
         
             for(var j = 0; j < diseaseData.doctorTest.length; j++){
                 doctorTest.push(diseaseData.doctorTest[j]);
             }
        }
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": doctorTest});
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}
/**
 * Function is to add new triage
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 25-April-2017
 */
function addNewTriage(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
    if (!req.body.name) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else {
        var triage = new Triage(req.body);
        triage.save(function (err, triage) {
            if (err) {
                res.json({code: 404, message: utility.validationErrorHandler(err)})
            } else {
                res.json({ code: 200, message: constantmsg.diseaseAddedSuccess,data: triage})}
        })
      }
   }).catch(function (err) {
            return res.json({ code: 402, message: err, data: {} });
        })
}

/**
 * Function is use to get all index list
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 27-April-2017
 */// req: take type: disease/ triage
function getIndexTitleList(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
         var type = req.swagger.params.indexType.value;
         var indexTitleList;
         if(type == "Disease"){
               indexTitleList = yield Disease.find({},{name: 1}).exec();
         }
         else if(type == "Triage"){
              indexTitleList = yield Triage.find({}, {name: 1}).exec();
         }
        return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": indexTitleList});
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}

/**
 * Function is use to get triage by Id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 30-Apr-2017
 */
function getTriagebyId(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
     var triageid = req.swagger.params.id.value;
    Triage.findById({_id:triageid}).exec(function(err, disease) {
        if (err) { res.json({code: 404, message: constantmsg.errorRetreivingData });
        } else if(disease){
            res.json({ code: 200, message: constantmsg.dataRetrievedSuccess, data: disease})
        }else{
           res.json({code:200,message:constantmsg.noDataFound }) 
        }
     })
 }).catch(function(err) {
     return res.json({ code: 402, message: err, data: {} });
    })
}

