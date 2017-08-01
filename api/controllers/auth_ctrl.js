'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Role = mongoose.model('Role'),
    AuditLog =  mongoose.model('AuditLog'),
    AuditLogController = require('./auditlog_ctrl'),
    User = require('../models/users'),
    Setting =  mongoose.model('Setting'),
    jwt = require('jsonwebtoken'),
    validator = require('validator'),
    Response = require('../lib/response.js'),
    utility = require('../lib/utility.js'),
    config = require('../../config/config.js'),
  //  common = require('../../config/common.js'),
    async = require('async'),
    moment = require('moment-timezone'),
    constantsObj = require('./../../constants'),
    querystring = require('querystring'),
    https = require('https'),
    co = require('co'),
    moment = require('moment-timezone');

var checkInactiveUserInterval;


module.exports = {
    userLogin: userLogin,
    userActivation: userActivation,
    forgotPassword: forgotPassword,
    loggedin: loggedin,
    userLogOut: userLogOut,
    verifyLink: verifyLink
};

startAllSchedulers();

function startAllSchedulers() {
    console.log("------------startAllSchedulers----------------");
    setTimeout(function () {
       checkInActiveUser();
    }, 60000); 
    checkInactiveUserInterval = setInterval(checkInActiveUser, 300000); // Fetch game data every 2 hours
}

function checkInActiveUser() {
    co(function* () {
        let users = yield User.find().exec();
        var currentDate = moment.utc();
     //   console.log("currentDate-->", currentDate);
        for (var i = 0; i < users.length; i++) {
            if (users[i].isLoggedIn = true) {
                if (users[i].lastActivityTime) {
                    var lastActivityTime = moment(users[i].lastActivityTime);
                 //   console.log("lastActivityTime-->" + i + "--->" + lastActivityTime);
                    var minuteDiff = moment(currentDate).diff(lastActivityTime, 'minutes');
                  //  console.log("minuteDiff-->", minuteDiff);
                    if (minuteDiff >= 20) {
                        //console.log("user-->", users[i]);
                        users[i].isLoggedIn = false;
                        users[i].access_token = '';
                        let saveduserdetails = yield users[i].save();
                       // console.log("saveduserdetails-->", saveduserdetails);
                    }
                }
            }
        }
    }).catch(function (err) {
        console.log("checkInActiveUser:--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to check admin login status
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 30-Jan-2017
 */
function loggedin(req, res) {
    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        console.log('parts', parts);
        if (parts.length == 2) {
            jwt.verify(parts[1], constantsObj.config.secret, function(err, user) {
                if (err) {
                    res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
                } else {
                    if (user) {
                        User.findById(user.id).exec(function(err, user) {
                            if (err)
                                res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
                            else if (!user)
                                res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
                            else{
                                res.json({ "code": 200, status: "OK", user: user });
                            }
                        });
                    } else {
                        res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
                    }
                }
            });
        } else {
            res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
        }
    } else {
        res.json(Response(402, "Failure", constantsObj.messages.authenticationFailed));
    }
}


/**
 * Function is admin login
 * @access private
 * @return json
 * Created by Udit
 * @smartData Enterprises (I) Ltd
 * Created Date 24-Jan-2017
 */
// function userLogin(req, res) {
//     co(function* () {
//         if (validator.isNull(req.body.email) || !req.body.email) {
//             return res.json(Response(402, "failed", constantsObj.validationMessages.emailRequired));
//         } else if (req.body.email && !validator.isEmail(req.body.email)) {
//             return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmail));
//         } else if (validator.isNull(req.body.password) || !req.body.password) {
//             return res.json(Response(402, "failed", constantsObj.validationMessages.passwordRequired));
//         } else {
//             var localDate = new Date();
//             var localMoment = moment();
//             var utcMoment = moment.utc();
//             var utcDate = new Date( utcMoment.format() );
//             var remoteAddress = req.connection.remoteAddress;
//             console.log('REMOTE ADDRESS---->', remoteAddress);
//             console.log('REMOTE ADDRESS IPV6 CHECK---->', remoteAddress.includes("::ffff:"));
//             if (remoteAddress.includes("::ffff:")) {
//                 remoteAddress = remoteAddress.replace('::ffff:', '');
//             }
//             console.log('AFTER IPV6 REPLACE:---->', remoteAddress);
//             let settingInfo = yield Setting.find({});
//              console.log('settingInfo:---->', settingInfo);
//             var EMC_IpAddress = '';
//             if (settingInfo && settingInfo[0] && settingInfo[0].ip) {
//                 EMC_IpAddress = settingInfo[0].ip;
//                 console.log('EMC_IpAddress:---->', EMC_IpAddress);
//             }
//             console.log("password----->", req.body.password);
//             console.log("password----->", utility.getEncryptText(req.body.password));
//             if (EMC_IpAddress == remoteAddress) {
//                  console.log('----------ip address match-----------');
//                 let userData = yield User.findOne({ email: req.body.email, password: utility.getEncryptText(req.body.password), status: 'Active', isverified: true }).exec();
//                 if (!userData) {
//                     return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmailOrPassword));
//                 } else {
//                     var user = {};
//                     var params = {
//                         id: userData._id
//                     }
//                     var token = jwt.sign(params, constantsObj.config.secret, {
//                         //  expiresIn: 1000 * 60 * 60 * 24 * 2 /*ms*s*m*h*day*/
//                         expiresIn: 60 * 60
//                     });
//                     userData.isLoggedIn = true;
//                     userData.loggedInTime = utcDate;
//                     userData.access_token = token;
//                     userData.save(function (err, userInfoDataModel) {
//                         if (err) {
//                             res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
//                         } else {
//                             var userInfoData = userInfoDataModel.toObject();
//                             userInfoData.uid = userInfoData._id;
//                             userInfoData.token = token;
//                             if (!userInfoData.profile_image) {
//                                 userInfoData.profile_image = '';
//                             }
//                             return res.json(Response(200, "success", constantsObj.messages.loginSuccess, userInfoData, token));
//                         }
//                     });
//                 }
//             }
//             else {
//                 console.log('----------ip address NOT MATCH-----------');
//                 console.log('----------req.body.homeToken-----------',req.body.homeToken);
//                 if (!req.body.homeToken) {
//                     return res.json(Response(402, "failed", constantsObj.validationMessages.homeTokenRequired));
//                 }
//                 //home token present check wheter it is same with on added when user created
//                 else {
//                     let userData = yield User.findOne({ email: req.body.email, password: utility.getEncryptText(req.body.password), homeToken: req.body.homeToken, status: 'Active', isverified: true }).exec();
//                     if (!userData) {
//                          console.log('----------ip address NOT MATCH: userData-----------', userData);
//                         return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmailOrPasswordOrHometoken));
//                     } else {
//                         console.log('----------ip address NOT MATCH: userData-----------', userData);
//                         var user = {};
//                         var params = {
//                             id: userData._id
//                         }
//                         var token = jwt.sign(params, constantsObj.config.secret, {
//                             //  expiresIn: 1000 * 60 * 60 * 24 * 2 /*ms*s*m*h*day*/
//                             expiresIn: 60 * 60
//                         });

//                         userData.access_token = token;
//                         userData.isLoggedIn = true;
//                         userData.loggedInTime = utcDate;
//                         userData.save(function (err, userInfoDataModel) {
//                             if (err) {
//                                 res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
//                             } else {
//                                 var userInfoData = userInfoDataModel.toObject();
//                                 userInfoData.uid = userInfoData._id;

//                                 userInfoData.token = token;
//                                 if (!userInfoData.profile_image) {
//                                     userInfoData.profile_image = '';
//                                 }
//                                 return res.json(Response(200, "success", constantsObj.messages.loginSuccess, userInfoData, token));
//                             }
//                         });
//                     }
//                 }
//             }
//         }
//     }).catch(function (err) {
//         console.log("User Login:--->", err);
//         return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
//     });
// }
function userLogin(req, res) {
    co(function* () {
        if (validator.isNull(req.body.email) || !req.body.email) {
            return res.json(Response(402, "failed", constantsObj.validationMessages.emailOrUsernameRequired));
        } 
        // else if (req.body.email && !validator.isEmail(req.body.email)) {
        //     return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmail));
        // }
        else if (validator.isNull(req.body.password) || !req.body.password) {
            return res.json(Response(402, "failed", constantsObj.validationMessages.passwordRequired));
        } else {
            var localDate = new Date();
            var localMoment = moment();
            var utcMoment = moment.utc();
            var utcDate = new Date( utcMoment.format() );
            var remoteAddress = req.connection.remoteAddress;
            console.log('REMOTE ADDRESS---->', remoteAddress);
            console.log('REMOTE ADDRESS IPV6 CHECK---->', remoteAddress.includes("::ffff:"));
            if (remoteAddress.includes("::ffff:")) {
                remoteAddress = remoteAddress.replace('::ffff:', '');
            }
            console.log('AFTER IPV6 REPLACE:---->', remoteAddress);
            let settingInfo = yield Setting.find({});
             console.log('settingInfo:---->', settingInfo);
            var EMC_IpAddress = '';
            if (settingInfo && settingInfo[0] && settingInfo[0].ip) {
                EMC_IpAddress = settingInfo[0].ip;
                console.log('EMC_IpAddress:---->', EMC_IpAddress);
            }
            console.log("password----->", req.body.password);
            console.log("password----->", utility.getEncryptText(req.body.password));
            var emailOrUsername = req.body.email;
            console.log("emailOrUsername-->", emailOrUsername);
            if (EMC_IpAddress == remoteAddress) {
                 console.log('----------ip address match-----------');
                let userData = yield User.findOne({ $or:[{username: emailOrUsername}, {email: emailOrUsername.toLowerCase()}], password: utility.getEncryptText(req.body.password), status: 'Active', isverified: true }).populate('role_id').exec();
                if (!userData) {
                    return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmailOrPassword));
                } else {
                    var user = {};
                    var params = {
                        id: userData._id
                    }
                    var token = jwt.sign(params, constantsObj.config.secret, {
                        //  expiresIn: 1000 * 60 * 60 * 24 * 2 /*ms*s*m*h*day*/
                        expiresIn: 60 * 60
                    });
                    userData.isLoggedIn = true;
                    userData.loggedInTime = utcDate;
                    userData.access_token = token;
                    userData.save(function (err, userInfoDataModel) {
                        if (err) {
                            res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
                        } else {
                            var userInfoData = userInfoDataModel.toObject();
                            userInfoData.uid = userInfoData._id;
                            userInfoData.token = token;
                            if (!userInfoData.profile_image) {
                                userInfoData.profile_image = '';
                            }
                            return res.json(Response(200, "success", constantsObj.messages.loginSuccess, userInfoData, token));
                        }
                    });
                }
            }
            else {
                console.log('----------ip address NOT MATCH-----------');
                console.log('----------req.body.homeToken-----------',req.body.homeToken);
                if (!req.body.homeToken) {
                    return res.json(Response(402, "failed", constantsObj.validationMessages.homeTokenRequired));
                }
                //home token present check wheter it is same with on added when user created
                else {
                    let userData = yield User.findOne({ $or:[{username: emailOrUsername}, {email: emailOrUsername.toLowerCase()}], password: utility.getEncryptText(req.body.password), homeToken: req.body.homeToken, status: 'Active', isverified: true }).populate('role_id').exec();
                    if (!userData) {
                         console.log('----------ip address NOT MATCH: userData-----------', userData);
                        return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmailOrPasswordOrHometoken));
                    } else {
                        console.log('----------ip address NOT MATCH: userData-----------', userData);
                        var user = {};
                        var params = {
                            id: userData._id
                        }
                        var token = jwt.sign(params, constantsObj.config.secret, {
                            //  expiresIn: 1000 * 60 * 60 * 24 * 2 /*ms*s*m*h*day*/
                            expiresIn: 60 * 60
                        });

                        userData.access_token = token;
                        userData.isLoggedIn = true;
                        userData.loggedInTime = utcDate;
                        userData.save(function (err, userInfoDataModel) {
                            if (err) {
                                res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
                            } else {
                                var userInfoData = userInfoDataModel.toObject();
                                userInfoData.uid = userInfoData._id;

                                userInfoData.token = token;
                                if (!userInfoData.profile_image) {
                                    userInfoData.profile_image = '';
                                }
                                return res.json(Response(200, "success", constantsObj.messages.loginSuccess, userInfoData, token));
                            }
                        });
                    }
                }
            }
        }
    }).catch(function (err) {
        console.log("User Login:--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * Function is use to activate user account after sign up by user id
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function userActivation(req, res) {
    var updateUserRecord = {
        status: 1,
    }
    User.update({ _id: req.body.userId }, { $set: updateUserRecord }, function(err) {
        if (err) {
            res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
        } else {
            res.json({ code: 200, message: 'Your account has been activated successfully.' });
        }
    });
}

/**
 * Function is use to activate user account after sign up by verifying Link
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 123-Jan-2017
 */
// function verifyLink(req, res) {
//     User.findOne({
//         verifying_token: req.params.id
//     }, function(err, user) {
//         if (err || !user) {
//             res.redirect("/#/show-message?emailSuccess=false");
//         } else {
//             user.status = 'Active';
//             user.verifying_token = null;
//             user.save(function(err, data) {
//                 if (err)
//                     res.redirect("/#/verifying-link?success=false");
//                 else {
//                     res.redirect("/#/verifying-link?success=true");
//                 }
//             });
//         }

//     })
// }
function verifyLink(req, res) {
    console.log("<-----verifylink----------->");
    User.findOne({
        verifying_token: req.params.id
    }, function(err, user) {
        if (err || !user) {
            res.redirect("/#/show-message?emailSuccess=false");
        } else {
           // console.log("<-----verifylink----------->");
         //   user.verifying_token = null;
            user.save(function(err, data) {
                if (err)
                    res.redirect("/#/verifying-link?success=false");
                else {
                    console.log("------->redirecting to change password", data._id);
                   // res.redirect("/#/changePassword");
                    res.redirect("/#/changePassword?i=" + data._id);
                }
            });
        }
    })
}


/**
 * Forgot password
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-Jan-2017
 */
function forgotPassword(req, res) {
    co(function* () {
        console.log('-----forgotPassword----');
        if (validator.isNull(req.body.email)) {
            return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
        } else {
            User.findOne({ isFamilyDoctor: { $ne: 1 }, email: req.body.email }).exec(function (err, userInfoData) {
                if (err) {
                    return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
                } else {
                    if (!userInfoData) {
                        return res.json(Response(402, "failed", constantsObj.validationMessages.emailNotExist));
                    } else {
                        if (userInfoData.status == 'Inactive') {
                            return res.json({ code: 402, message: 'Your account not activated yet.', data: {} });
                        } else if (userInfoData.deleted == true) {
                            return res.json({ code: 402, message: 'Your account has been deleted.', data: {} });
                        }
                        var date = new Date();
                        var verifingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + date.getTime());
                        userInfoData.verifying_token = verifingLink;

                        userInfoData.save(function (err, data) {
                            if (err)
                                return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
                            else {
                                var userMailData = { email: userInfoData.email, firstname: userInfoData.firstname, lastname: userInfoData.lastname, verifying_token: userInfoData.verifying_token };
                                utility.readTemplateSendMail(userInfoData.email, constantsObj.emailSubjects.forgotPassword, userMailData, 'forgot_password', '', function (err, resp) { });

                                // var userMailData = { email: userInfoData.email, firstname: userInfoData.firstname, lastname: userInfoData.lastname, password: userInfoData.password };
                                // utility.readTemplateSendMail(userInfoData.email, constantsObj.emailSubjects.forgotPassword, userMailData, 'forgot_password', function(err, resp) {});
                                return res.json(Response(200, "success", constantsObj.messages.forgotPasswordSuccess, {}));
                            }
                        });
                    }
                }
            });
        }
    }).catch(function (err) {
        console.log("forgotPassword:--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}

/**
 * User Log out
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 03-July-2017
 */
function userLogOut(req, res) {
    co(function* () {
        console.log("----userLogout------", req.user.id);
        let userInfo = yield utility.getUserInfoByToken(req.headers);
        let constantmsg = yield utility.language(userInfo);
        if (req.user.id) {
            var userId = req.user.id;
            User.findById(userId).exec(function (err, user) {
                if (err) {
                    return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, {}));
                } else {
                    if (user) {
                        user.isLoggedIn = false;
                        user.save(function (err, data) {
                            if (err) {
                                return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, {}));
                            } else {
                                return res.json(Response(200, "success", constantmsg.logoutSuccess, {}));
                            }
                        });
                    } else {
                        return res.json(Response(402, "failed", constantsObj.validationMessages.userNotFound, {}));
                    }
                }
            });
        }
    }).catch(function (err) {
        console.log("forgotPassword:--->", err);
        return res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
    });
}




