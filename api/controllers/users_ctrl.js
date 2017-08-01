'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Disease= mongoose.model('Disease'),
    KupatCholim= mongoose.model('Kupat'),
    Status = mongoose.model('Status'),
    Triage = mongoose.model('Triage'),
    Setting =  mongoose.model('Setting'),
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
    co = require('co'),
    moment = require('moment-timezone');

  //  common = require('../../config/common.js');

module.exports = {
    // by sunny on 27/april/2017 addfamilydocter
    addFamilyDoctor: addFamilyDoctor,
    addUser: addUser,
    getUserList: getUserList,
    getuserbyId: getuserbyId,
    getFamilyDoctors: getFamilyDoctors,
    getStatus: getStatus,
    addstatus: addstatus,
    dashboardCount: dashboardCount,
    enableDisableUser: enableDisableUser,
    deleteUserById: deleteUserById,
    getDoctorList: getDoctorList,
    uploadImage: uploadImage,
    getUserByToken:getUserByToken,
    resetPassword:resetPassword,
    updateColorStatus:updateColorStatus,
    colorStatusbyId:colorStatusbyId,
    addOrUpdateIp: addOrUpdateIp,
    updateProfile:updateProfile,
    getSettingsData: getSettingsData,
    updateLanguage:updateLanguage
    // getUserById:getUserById
};

// -----------------By Rahul Gupta for EmailAlreadyExist--------------------
//
// function addUser(req, res){
// var addUser= new User(req.body);
// User.findOne({"email":req.body.email}).exec(function(err,user){
// if(err){
//      res.json({code:500});
//     }else if(user){
//        res.json({code:600, 
//        message:constantsObj.messages.emailAlreadyExist}); 
//     }else{
//        addUser.save(function(err){
//     if(err){ 
//           res.json({
//           code: 404, 
//           message: utility.validationErrorHandler(err) 
//         }) 
//   }else{
//       res.json({
//          code: 200,
//          message:constantsObj.messages.userAddedSuccess,
//          data:user
//        })
//       } }) 
//     }
// })
// }

/**
 * Function is use to Add user
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 1-may-2017
 */

function addUser(req, res) {
    co(function* () {
         let userInfo = yield utility.getUserInfoByToken(req.headers);
         let constantmsg= yield utility.language(userInfo);
        User.findById(req.body._id).exec(function (err, userInfoData) {
            if (err) {
                return res.json(Response(500, "failed", constantmsg.internalError, err));
            } else {
                User.existCheck(req.body.email, ((userInfoData) ? userInfoData._id : ''), function (err, exist) {
                    if (err) {
                        return res.json(Response(500, "failed", constantmsg.internalError, err));
                    } else {
                        if (exist != true) {
                            return res.json(Response(402, "failed", exist));
                        } else {
                            if (userInfoData) {
                                userInfoData.firstname = req.body.firstname;
                                userInfoData.username = (req.body.firstname).toLowerCase() + ((req.body.lastname).toLowerCase()).charAt(0);
                                userInfoData.lastname = req.body.lastname;
                                userInfoData.role_id = req.body.role_id;
                                userInfoData.teleNo = req.body.teleNo;
                                userInfoData.mobileNo = req.body.mobileNo;
                                userInfoData.email = (req.body.email).toLowerCase();
                                userInfoData.Address = req.body.Address;
                                userInfoData.homeToken = req.body.homeToken;
                                  //set verifying token
                                var date = new Date();
                                var verifingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + date.getTime());
                                userInfoData.verifying_token = verifingLink;
                                userInfoData.save(function (err, user) {
                                    if (err) {
                                        res.json({
                                            code: 404,
                                            message: utility.validationErrorHandler(err)
                                        })
                                    } else {
                                        if (user.isverified == false && user.status == 'Active') {
                                            var userMailData = { email: user.email, firstname: user.firstname, lastname: user.lastname, verifying_token: user.verifying_token,  username: user.username };
                                            utility.readTemplateSendMail(user.email, constantsObj.emailSubjects.verify_email, userMailData, 'verify_email', '', function (err, resp) { });
                                        }
                                        res.json({
                                            code: 200,
                                            message: constantmsg.userAddedSuccess,
                                            data: user
                                        })
                                    }
                                })
                            }
                            else if (!userInfoData) {
                                var username = (req.body.firstname).toLowerCase() + ((req.body.lastname).toLowerCase()).charAt(0);
                                req.body.username = username;
                                req.body.email = (req.body.email).toLowerCase();
                                var user = new User(req.body);
                                user.role_id = req.body.role_id;
                                //set verifying token
                                var date = new Date();
                                var verifingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + date.getTime());
                                user.verifying_token = verifingLink;
                                user.save(function (err, user) {
                                    if (err) {
                                        res.json({
                                            code: 404,
                                            message: utility.validationErrorHandler(err)
                                        })
                                    } else {
                                        if (user.isverified == false && user.status == 'Active') {
                                            var userMailData = { email: user.email, firstname: user.firstname, lastname: user.lastname, verifying_token: user.verifying_token,  username: user.username };
                                            utility.readTemplateSendMail(user.email, constantsObj.emailSubjects.verify_email, userMailData, 'verify_email', '', function (err, resp) { });
                                        }
                                        res.json({
                                            code: 200,
                                            message: constantmsg.userAddedSuccess,
                                            data: user
                                        })
                                    }
                                })
                            } else {
                                return res.json(Response(402, "failed", constantmsg.userUpdatedFailed, err));
                            }
                        }
                    }
                });
            }
        });
    }).catch(function (err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}  

/**
 * Function is use to get user list
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 3-may-2017
 */

function getUserList(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var count = req.query.count ? req.query.count : 0;
        count = parseInt(count);
        var skip = req.query.count * (req.query.page - 1);
        var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
         for (var key in sorting) {
                var value = sorting[key];
                sorting[key] = (value == 'desc') ? -1 : 1;
         }

        var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
        var condition = { isFamilyDoctor: { $ne: 1 }, deleted: false };
        if (searchText != undefined && searchText != 'undefined') {
            condition.$or = [
                { 'firstname': new RegExp(searchText, 'gi') },
                { 'lastname': new RegExp(searchText, 'gi') },
                { 'email': new RegExp(searchText, 'gi') },
                { 'mobileNo': new RegExp(searchText, 'gi') },
                { 'status': new RegExp(searchText, 'gi') },
                { 'roleInfo.title': new RegExp(searchText, 'gi') },
                { 'username': new RegExp(searchText, 'gi') },
            ];
        }
        let aggregate = [{
            $lookup: {
                from: "roles",
                localField: "role_id",
                foreignField: "_id",
                as: "roleInfo"
            }
        },
        { $unwind: "$roleInfo" },
        { $match: condition },
        {
            $project: {
                firstname: 1,
                lastname: 1,
                email: 1,
                mobileNo: 1,
                profileName:1,
                status: 1,
                username: 1,
                roleInfo: '$roleInfo'
            }
        }
        ];
        if (skip > 0) {
            aggregate.push({ $skip: skip });
        }
        if (count > 0) {
            aggregate.push({ $limit: count });
        }
       // console.log(sorting,'-----');
        if (sorting) {
            aggregate.push({ $sort: sorting });
        }
        let userList = yield User.aggregate(aggregate);
        console.log("userList--->", userList);
        var getCount = User.find(condition).count().exec();
        getCount.then(function (totalLength) {
            return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": userList, "totalLength": totalLength });
        }).catch(function (err) {
            return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
        });
    });
}
/**
 * Function is use to get user by id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 5-may-2017
 */

function getuserbyId(req, res) {
 co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var userid = req.swagger.params.id.value;
    User.findById({ _id: userid }).exec(function (err, result) {
    if (err) {
      res.json({code: 404, message: constantmsg.errorRetreivingData });
    } else if (result) {
      res.json({ code: 200, data: result})
    } else {
      res.json({code: 200,message:constantmsg.noDataFound})
    }
   })
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  })
}
/**
 * Function is use to get family Doctor
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 6-May-2017
 */
function getFamilyDoctors(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var count = req.query.count ? req.query.count : 0;
    var skip = req.query.count * (req.query.page - 1);
    var sorting = req.query.sorting ? req.query.sorting : { _id: -1 };
    var condition = { isFamilyDoctor:  1 ,  deleted: false};

  var searchText = decodeURIComponent(req.query.searchText).replace(/[[\]{}()*+?,\\^$|#\s]/g, "\\s+");
  if (req.query.searchText) {
    condition.$or = [{ 'firstname': new RegExp(searchText, 'gi') },{'KupatCholim.name': new RegExp(searchText,'gi') }, { 'lastname': new RegExp(searchText, 'gi') }, { 'email': new RegExp(searchText, 'gi') }, { 'userType': new RegExp(searchText, 'gi') }, { 'mobileNo': new RegExp(searchText, 'gi') }];
  }
  User.find(condition, {})
    .limit(parseInt(count))
    .skip(parseInt(skip))
    .sort(sorting)
    .lean()
    .populate('KupatCholim')
    .exec(function (err, userData) {
      if (err) {
        return res.json(Response(500, "failed", constantmsg.internalError, err));
      } else {
        var getCount = User.find(condition).count().exec();
        getCount.then(function (totalLength) {
          return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": userData, "totalLength": totalLength });
        })
      }
    });
    }).catch(function (err) {
          return res.json({ 'code': 500, status: 'failure', "message": constantmsg.errorRetreivingData, "data": err });
        });
}


/**
 * Function is use to get family Doctor
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 8-may-2017
 */

function addFamilyDoctor(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let addUserData = yield User.findById(req.body._id);
        if (addUserData) {
             addUserData._id = req.body._id;
             addUserData.firstname = req.body.firstname;
             addUserData.lastname = req.body.lastname;
             addUserData.KupatCholim = req.body.KupatCholim;
             addUserData.teleNo = req.body.teleNo;
             addUserData.userType=req.body.userType;
             addUserData.mobileNo = req.body.mobileNo;
             addUserData.email = req.body.email;
             addUserData.Address = req.body.Address;
             addUserData.isFamilyDoctor = 1;
           
            let savedData = yield addUserData.save();
            return res.json(Response(200, "success", constantmsg.familyDoctorUpdatedSuccess, {}));
        }   if(!addUserData){
            var user = new User(req.body);
             user.isFamilyDoctor = 1;
            user.save(function (err, user) {
            if (err) {
              res.json({
              code: 404,
              message: utility.validationErrorHandler(err)
            })
            } else {
              res.json({
              code: 200,
              message: constantmsg.familyDoctorAddedSuccess,
              data: user
            })
            }
           })
        }else{
      return res.json(Response(402, "failed", constantmsg.familyDoctorUpdatedFailed, err));
    }
    }).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}




function addstatus(req, res) {
  if (!req.body.name || !req.body.colour) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
  } else {
    var status = new Status(req.body);
    status.save(function (err, status) {
      if (err) {
        console.log(err);
        res.json({
          code: 404,
          message: utility.validationErrorHandler(err)
        })
      } else {
        res.json({
          code: 200,
          message: constantsObj.messages.statusAddedSuccess,
          data: status
        })
}
    })
  }
}

/**
 * Function is use to dashboard count
 * @access private
 * @return json
 * Created by Udit
 * @smartData Enterprises (I) Ltd
 * Created Date 27-Jan-2017
 */
// function dashboardCount(req, res) {
//     async.parallel({
//         user: function(callback) {
//             User.find({userType: { $ne: 'FamilyDoctor'}}).count(function(err, count){
//                 if (err) 
//                     callback(err);
//                 else 
//                     callback(null, count);
//             });
//         },
//         disease: function(callback) {
//             Disease.find().count(function(err, count){
//                 if (err) 
//                     callback(err);
//                 else 
//                     callback(null, count);
//             });
//         },
//         status: function(callback) {
//             Status.find().count(function(err, count){
//                 if (err) 
//                     callback(err);
//                 else 
//                     callback(null, count);
//             });
//         },
//         KupatCholim: function(callback) {
//             KupatCholim.find().count(function(err, count){
//                 if (err) 
//                     callback(err);
//                 else 
//                     callback(null, count);
//             });
//         }
//     }, function(err, results) {
//          if (err) {
//             return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
//         } else {
//             return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": results});
//         }
//     });
// }

function dashboardCount(req, res) {
    co(function* () {
        var counts = yield {
            user: User.find({ userType: { $ne: 'FamilyDoctor' } }).count(),
            disease: Disease.find().count(),
            status: Status.find().count(),
            kupatCholim: KupatCholim.find().count(),
            index: co(function* () {
                let diseaseIndexList = yield Disease.find({ alertFreqency: { $exists: true, $ne: 0 } }).exec();
                let traigeIndexList = yield Triage.find({ alertFreqency: { $exists: true, $ne: 0 } }).exec();
                return diseaseIndexList.length + traigeIndexList.length;
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
 * Function is use to enable disable user
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 05-May-2017
 */
// function enableDisableUser(req, res) {
//     if (!req.body.userId || !req.body.status) {
//         return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
//     } else {
//         User.findById(req.body.userId).exec(function(err, data) {
//             if (err) {
//                 return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
//             } else {
//                 if (!data) {
//                     return res.json(Response(402, "failed", constantsObj.validationMessages.userNotFound, {}));
//                 } else {
//                     data.status = req.body.status;
//                     data.save(function(err, userData) {
//                         if (err) {
//                             return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
//                         } else {
//                             return res.json({ 'code': 200, status: 'success', "message": 'User '+((req.body.status == 'Active') ? 'activited' : 'deactivated') +' successfully', "data": userData });
//                         }
//                     });
//                 }
//             }
//         });
//     }
// }
function enableDisableUser(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
    console.log("------------enableDisableUser------------------");
    if (!req.body.userId || !req.body.status) {
        return res.json(Response(402, "failed", constantmsg.requiredFieldsMissing));
    } else {
        User.findById(req.body.userId).exec(function(err, data) {
            if (err) {
                return res.json(Response(500, "failed", constantmsg.internalError, err));
            } else {
                if (!data) {
                    return res.json(Response(402, "failed", constantmsg.userNotFound, {}));
                } else {
                    data.status = req.body.status;
                    if( data.isverified == false && data.status == 'Active' ){
                         var date = new Date();
                         var verifingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + date.getTime());
                         data.verifying_token = verifingLink;
                    }
                    data.save(function(err, userData) {
                        if (err) {
                            return res.json(Response(500, "failed", constantmsg.internalError, err));
                        } else {
                            //console.log("--------userData---------", userData);
                            if( userData.isverified == false && userData.status == 'Active' ){

                                var userMailData = { email: userData.email, firstname: userData.firstname, lastname: userData.lastname, verifying_token: userData.verifying_token, password: utility.getDecryptText(userData.password), username: userData.username };
                                utility.readTemplateSendMail(userData.email, constantsObj.emailSubjects.verify_email, userMailData, 'verify_email', '', function(err, resp) {});
                                // var userMailData = { email: userData.email, password: utility.getDecryptText(userData.password), firstname: userData.firstname, lastname: userData.lastname  };
                                // utility.readTemplateSendMail(userData.email, constantsObj.emailSubjects.verify_email, userMailData, 'verify_email', '', function (err, resp) { });
                            }
                            return res.json({ 'code': 200, status: 'success', "message": 'User '+((req.body.status == 'Active') ? 'activited' : 'deactivated') +' successfully', "data": userData });
                        }
                    });
                }
            }
        });
    }
}).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}
/**
 * Function is use to delete User by id
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 10-May-2017
 */
function deleteUserById(req, res) {
    co(function*() {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
      var id = req.swagger.params.id.value;
      User.findById(id).exec(function(err, data) {
        if (err) {
            return res.json(Response(500, "failed",constantmsg.internalError, err));
        } else {
            if (!data) {
                return res.json(Response(402, "failed", constantmsg.userNotFound, {}));
            } else {
                data.deleted = true;
                data.save(function(err, userData) {
                    if (err)
                        return res.json(Response(500, "failed", constantmsg.internalError, err));
                    else {
                        return res.json({ 'code': 200, status: 'success', "message": constantmsg.userDeleteSuccess, "data": {} });
                    }
                });
            }
        }
    })
}).catch(function(err) {
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to get user by id
 * @access private
 * @return json
 * Created by Swapnali 
 * @smartData Enterprises (I) Ltd
 * Created Date 18-May-2017
 */
function getDoctorList(req, res) {
    co(function* () {
        var doctorList = [];
        var currentDate = moment.utc();
        let users = yield User.find({ isFamilyDoctor: 0, status: 'Active', isverified: true, isLoggedIn: true, deleted: false }).populate('role_id').lean().exec();
        // console.log('users---------------->', users);
        for (var i = 0; i < users.length; i++) {
            var lastLoggedInTime = moment(users[i].loggedInTime);
            var hourDiff = moment(currentDate).diff(lastLoggedInTime, 'hours');
            console.log("hourDiff-->", hourDiff);
            if (users[i].role_id.name == 'doctor' && hourDiff <= 2) {
                doctorList.push(users[i]);
            }
        }
        // console.log('------doctorList-------', doctorList);
        return res.json({ 'code': 200, status: 'success', "message": constantsObj.messages.dataRetrievedSuccess, "data": doctorList });
    }).catch(function (err) {
        console.log("err in getdoctorlist--->", err);
        return res.json({ code: 402, message: err, data: {} });
    });
}

// function getDoctorList(req, res) {
//   co(function* () {
//       let userInfo = yield utility.getUserInfoByToken(req.headers);
//       let constantmsg= yield utility.language(userInfo);
//     var doctorList = [];
//     let users = yield User.find({ isFamilyDoctor: 0, status: 'Active', isverified: true, isLoggedIn: true, deleted: false }).populate('role_id').lean().exec();
//     for(var i = 0 ; i < users.length; i++){
//       if( users[i].role_id.name == 'doctor' ){
//            doctorList.push(users[i]);
//        }
//     }
//     return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": doctorList });
//   }).catch(function (err) {
//     return res.json({ code: 402, message: err, data: {} });
//   });    
// }

/**
 * Function is use to Upload Image
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 3-Jun-2017
 */
function uploadImage(req, res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        var userid = req.user.id; 
        var timestamp = Number(new Date()); // current time as number
        var file = req.swagger.params.file.value;
        var splitFile = file.originalname.split('.');
        var filename = +timestamp + '.' + ((splitFile.length > 0) ? splitFile[splitFile.length - 1] : file.originalname);
        var imagePath = path.resolve('/home/mcsidigitalhc/public/img/'+filename);
        fs.writeFile(imagePath, file.buffer, function(err) {
        User.update({'_id':userid},{$set: { profileName : filename}},function(err,resp){
        if (err) {
            return res.json({ code: 400, message: ''+err });
        } else {
            return res.json({ code: 200, message:constantmsg.Imagesuccess,data: filename})
         }
       })
    })
    }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  });    
}

/**
 * Function is use to Get User By Id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 3-Jun-2017
 */

function getUserByToken(req, res) {
   co(function* () {
  let userInfo = yield utility.getUserInfoByToken(req.headers);
  let constantmsg= yield utility.language(userInfo);
  userInfo.password = utility.getDecryptText(userInfo.password);
   return res.json({ 'code': 200, status: 'success', "message": constantmsg.dataRetrievedSuccess, "data": userInfo });
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to resetPassword
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 11-Jun-2017
 */
function resetPassword(req,res){ 
co(function* () {
    console.log("resetPassword--->");
  //let userInfo = yield utility.getUserInfoByToken(req.headers);
  // console.log("userInfo--->", userInfo);

  let constantmsg = constantsObj.messageEn;
  //console.log("constantmsg--->", constantmsg);

  var password = req.body.password;
  var id = '';
  if(req.user && req.user.id){id = req.user.id;
  }
  else{
      id = req.body.id;
     }
  User.findById(id).exec(function(err,data) {
    User.update({
        _id: id
    //},{$set: { password : password}},
    },{$set: { password : utility.getEncryptText(req.body.password)}, isverified:true},
    function(err,password){
       if (err) {
        res.json({
          code: 404,
          message: utility.validationErrorHandler(err)
        })
      } else {
        res.json({
          code: 200,
          message: constantmsg.passwordAddedSuccess,
        //  data: password
        });
      }
    });
 });
}).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to update Color Status
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 11-Jun-2017
 */
function updateColorStatus(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
    var id= req.body.id;
    Status.findOneAndUpdate({
        id:id},{$set:req.body}).exec(function(err,resp){       
      if (err) {
        res.json({code: 404,message: utility.validationErrorHandler(err)
        })
      } else {
        res.json({code: 200, message: constantmsg.statusAddedSuccess, data: resp})
         } })
    }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to color Status by Id
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 11-Jun-2017
 */

function colorStatusbyId(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
     var id = req.swagger.params.id.value;
    Status.findById({_id:id}).exec(function(err, status) {
        if (err) {
            res.json({code: 404, message: constantmsg.errorRetreivingData});
        } else if(status){
            res.json({ code: 200, message: constantmsg.dataRetrievedSuccess, data: status})
        }else{
            res.json({code:400, message:constantmsg.noDataFound }) 
        }
    })
    }).catch(function(err) {
       return res.json({ code: 402, message: err, data: {} });
    })
}
/**
 * Function is use to Get Status 
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 11-Jun-2017
 */
function getStatus(req, res) {
 co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
  Status.find({}).exec(function (err, status) {
    if (err) {
      res.json({code: 404, message: constantmsg.errorRetreivingData})
    } else if (status && status.length) {
      res.json({code: 200, message:constantmsg.dataRetrievedSuccess, data: status })
    } else {
      res.json({ code: 200,message: constantmsg.noDataFound})
    }
  })
  }).catch(function (err) {
    return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to Add or update IP
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 26-June-2017
 */
function addOrUpdateIp(req, res) {
    co(function* () {
            let userInfo = yield utility.getUserInfoByToken(req.headers);
            let constantmsg= yield utility.language(userInfo);
            let settingInfo = yield Setting.find({});
            if (settingInfo && settingInfo[0]) {
                settingInfo[0].ip = req.body.ip;
                settingInfo[0].clientId = req.body.clientId;
                settingInfo[0].clientUsername = req.body.clientUsername;
                settingInfo[0].clientPassword = req.body.clientPassword;
                settingInfo[0].surveyEnLink = req.body.surveyEnLink;
                settingInfo[0].surveyHwLink = req.body.surveyHwLink;
                settingInfo[0].isSurveyEnEnabled = req.body.isSurveyEnEnabled;
                settingInfo[0].isSurveyHwEnabled = req.body.isSurveyHwEnabled;
                let savedData = yield settingInfo[0].save();
                return res.json(Response(200, "success", constantmsg.settingsUpdatedSuccess, {}));
            } else {
                 let savedData = yield new Setting({
                        "ip": req.body.ip,
                        "clientId": req.body.clientId,
                        "clientUsername": req.body.clientUsername,
                        "clientPassword": req.body.clientPassword,
                        "surveyEnLink": req.body.surveyEnLink,
                        "surveyHwLink": req.body.surveyHwLink,
                        "isSurveyEnEnabled": req.body.isSurveyEnEnabled,
                        "isSurveyHwEnabled": req.body.isSurveyHwEnabled,
                 }).save();
                 return res.json(Response(200, "success", constantmsg.settingsUpdatedSuccess, {}));
            }
    }).catch(function (err) {
        console.log('err', err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is to get settings data
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 5-July-2017
 */
function getSettingsData(req, res) {
   co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
        let settingInfo = yield Setting.find({});
        if (settingInfo && settingInfo[0]) {
             return res.json(Response(200, "success", constantmsg.settingsUpdatedSuccess, { data: settingInfo[0]}));
        }
        else{
           return res.json(Response(200, "success", constantmsg.settingsUpdatedSuccess, { data: {}}));
        }
  }).catch(function (err) {
      return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to Update User Profile
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 6-July-2017
 */
function updateProfile(req,res) {
    co(function* () {
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg= yield utility.language(userInfo);
         User.findById(req.user.id).exec(function(err,data) {
            User.update({ _id:req.user.id },{$set:req.body }, function(err,updateProfile){
            if (err) {
                res.json({code: 404, message: utility.validationErrorHandler(err) })
            } else {res.json({ code: 200,message: constantmsg.userUpdatedSuccess,data: updateProfile})
         }
     })    
 })
}).catch(function (err) {
      return res.json({ code: 402, message: err, data: {} });
  })
}

/**
 * Function is use to Update Language
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 11-July-2017
 */
function updateLanguage(req, res) {
    co(function* () {
    let userInfo = yield utility.getUserInfoByToken(req.headers);
    let constantmsg= yield utility.language(userInfo);
     User.findById(req.user.id).exec(function(err,data){
     User.update({_id:req.user.id },{$set:req.body },function(err,lang){
      if (err) {
        res.json({ code: 404,message: utility.validationErrorHandler(err) })
      } else {
        res.json({ code: 200, message: constantmsg.languageSuccess ,data: lang })}
    })
})
}).catch(function (err) {
      return res.json({ code: 402, message: err, data: {} });
  })
}



