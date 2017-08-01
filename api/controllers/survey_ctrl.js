'use strict';

var mongoose = require('mongoose'),
    Survey = mongoose.model('Survey'),
    VisitSurvey = mongoose.model('VisitSurvey'),
    VisitInfo = mongoose.model('VisitInfo'),
    Response = require('../lib/response.js'),
    util = require('util'),
    utility = require('../lib/utility.js'),
    constantsObj = require('./../../constants'),
    co = require('co');

module.exports = {
    addSurvey: addSurvey,
    visitSurvey: visitSurvey,
    submitSurvey: submitSurvey,  //get record visitId, record ko edit answer or rating save
    getSurveyByVisitId: getSurveyByVisitId,
    getSurveySetByAdmin : getSurveySetByAdmin
};

/**
 * Function is use to Add survey
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function addSurvey(req, res) {
    console.log("------------AddSUrvye------");
    co(function* () {
         let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        if (req.body.id) {
            let surveyData = yield Survey.findById(req.body.id);
            if (surveyData) {
                surveyData.question = req.body.question;
                surveyData.level = req.body.level;
                let savedData = yield surveyData.save();
                return res.json(Response(200, "success", constantmsg.surveyUpdatedSuccess, {}));
            } else {
                return res.json(Response(402, "failed", constantmsg.surveyUpdatedFailed, err));
            }
        }
        else {
            let savedData = yield new Survey({
                "name": req.body.name,
                "question": req.body.question,
                "level": req.body.level,
            }).save();
            return res.json(Response(200, "success", constantsObj.messages.surveyUpdatedSuccess, {}));
        }
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to add visit survey
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function visitSurvey(req, res) {
    if (!req.body.feedback || !req.body.rating) {
        return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
    } else {
        var visitSurvey = new VisitSurvey(req.body);
        visitSurvey.save(function (err, visitSurvey) {

            if (err) {
                res.json({
                    code: 404,
                    message: utility.validationErrorHandler(err)
                })

            } else {
                res.json({
                    code: 200,
                    message: constantsObj.messages.statusAddedSuccess,
                    data: visitSurvey
                })
            }
        }).catch(function (err) {
            return res.json({ code: 402, message: err, data: {} });
        })

    }
}



/**
 * Function is use get survey by id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function getSurveyByVisitId(req, res) {
    console.log("getSurveyByVisitId: ");

    var visitid = req.body.id;
     console.log("visitid: ", visitid);
    VisitSurvey.findById({ _id : visitid }).exec(function(err, getSurvey) {
        if (err) {
            res.json({
                code: 404,
                message: constantsObj.messages.errorRetreivingData
            });
        } 
         else if(getSurvey && getSurvey.length){
            res.json({
                code: 200,
                message: constantsObj.messages.dataRetrievedSuccess,
                data: getSurvey
            });
        }else {
            res.json({
                code: 200,
                message:constantsObj.messages.noDataFound,
                data: getSurvey
            });
        }
    }) .catch(function(err) {
          return res.json({ code: 402, message: err, data: {} });
    });
}

/**
 * Function is use submit patient visit survey
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function submitSurvey(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
    if (!req.body._id) {
        return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
    } else {
        VisitSurvey.find({ '_id': req.body._id }).update({
            '_id': req.body._id
        }, {
                $set: req.body
            }).exec(function (err, survey) {
                console.log("Survey:", survey);
                if (err) {
                    res.json({
                        code: 404,
                        message: utility.validationErrorHandler(err)
                    });
                } else {
                    res.json({
                        code: 200,
                        message: constantmsg.surveySubmitedSuccess,
                        data: survey
                    });
                }
            })
    }
          }).catch(function (err) {
                return res.json({ code: 402, message: err, data: {} });
            });
    }


/**
 * Function is to get survey list set by admin
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 29-April-2017
 */
function getSurveySetByAdmin(req, res) {
    co(function*() {
        let surveyList = yield Survey.find({}).lean().exec();
        if(surveyList.length > 0){
           return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": surveyList});
        }
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), {}));
    });
}





