'use strict';

var mongoose = require('mongoose'),
    Kupat = mongoose.model('Kupat'),
    constantsObj = require('./../../constants'),
    utility = require('../lib/utility.js'),
    co = require('co');
   

module.exports = {
    addkupatCholim: addkupatCholim,
    getkupatCholim: getkupatCholim,
    updatekupatCholim: updatekupatCholim,
    deletekupatCholimbyId: deletekupatCholimbyId,
    getkupatCholimbyId: getkupatCholimbyId
};

/**
 * Function is use to add kupat cholim 
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */


function addkupatCholim(req, res){
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var addkupatCholim= new Kupat(req.body);
    Kupat.findOne({"email":req.body.email}).exec(function(err,kupatCholim){
    if(err){
     res.json({err});
    }else if(kupatCholim){
       res.json({code:400,message:constantmsg.emailAlreadyExist}); 
    }else{
       addkupatCholim.save(function(err,kupatCholim){
    if(err){ 
       res.json({ code: 400, message: utility.validationErrorHandler(err) }) 
  }else{res.json({ code: 200, message:constantmsg.kupatCholimAddedSuccess,data:kupatCholim })} }) 
    }
})
    }).catch(function (err) {
   return res.json({ code: 402, message: err, data: {} });
  })
}
/**
 * Function is use to get Kupat Cholim  
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */
function getkupatCholim(req, res) {
 co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
  var count = req.query.count ? req.query.count : 0;
  var skip = req.query.count * (req.query.page - 1);
  var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
  var condition={ };
  var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
  if (req.query.searchText) {
    condition.$or = [{ 'name': new RegExp(searchText, 'gi')},{ 'email': new RegExp(searchText, 'gi')}];
  }
  Kupat.find(condition, {})
    .limit(parseInt(count))
    .skip(parseInt(skip))
    .sort(sorting)
    .lean()
    .exec(function (err, result) {
      if (err) {
        return res.json(Response(500, "failed", constantmsg.internalError, err));
      } else {
        var getCount = Kupat.find(condition).count().exec();
        getCount.then(function (totalLength) {
          return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": result, "totalLength": totalLength });
        }).catch(function (err) {
          return res.json({ 'code': 500, status: 'failure', "message": constantmsg.errorRetreivingData, "data": err });
        });
      }
    });
}).catch(function (err) {
   return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to delete Kupat Cholim   
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */

function deletekupatCholimbyId(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    Kupat.remove({
        _id: req.swagger.params.id.value
    }).exec(function(err, kupatCholim) {
        if (err) {
            res.json({code: 404, message: constantmsg.errorRetreivingData });
        } else if(kupatCholim){
            res.json({code: 200,message: constantmsg.kupatCholimdeleteSuccess,data: kupatCholim})
        }else{
           res.json({ code:400, message:constantsObj.messages.noDataFound})  }
    })
    }).catch(function(err) {
        return res.json({ code: 402, message: err, data: {} });
    })
}
/**
 * Function is use to update Kupat Cholim   
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */


function updatekupatCholim(req,res){
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    if (!req.body.name || !req.body.price) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else {
    Kupat.update({ _id: req.swagger.params.id.value}, { $set: req.body }).exec(function(err,kupatCholim){
        if(err){
            res.json({ code:404, message: utility.validationErrorHandler(err)})
        }else{
            res.json({code:200, message:constantmsg.kupatCholimupdateSuccess,data: kupatCholim})}})
        }
    }).catch(function(err) {
        return res.json({ code: 402, message: err, data: {} });
    })
}
/**
 * Function is use to get Kupat Cholim by ID  
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */

function getkupatCholimbyId(req, res) {
co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
     var kupatid = req.swagger.params.id.value;
    Kupat.findById({_id:kupatid}).exec(function(err, kupatCholim) {
        if (err) {
            res.json({code: 404,message: constantmsg.errorRetreivingData });
        } else if(kupatCholim){
            res.json({ code: 200, message: constantmsg.dataRetrievedSuccess,data: kupatCholim})
        }else{
            res.json({code:400, message:constantmsg.noDataFound}) 
        }
    })
    }).catch(function(err) {
        return res.json({ code: 402, message: err, data: {} });
    })
}