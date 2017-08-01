'use strict';
/*
 * Utility - utility.js
 * Author: smartData Enterprises
 * Date: 3rd Jan 2017
 */
var jwt = require('jsonwebtoken');
var constantsObj = require('./../../constants');
var crypto = require('crypto'),
    algorithm = constantsObj.config.cryptoAlgorithm,
    password = constantsObj.config.cryptoPassword;
var nodemailer = require('nodemailer');
var fs = require("fs");
var path = require('path');
var config = require('../../config/config.js');
var nodemailer = require('nodemailer');
var async = require('async');
var User = require('../models/users');
var Hashids = require("hashids");
var hashids = new Hashids(config.SALTKEY);
var mkdirp = require('mkdirp');
var moment = require('moment-timezone');


var utility = {};

/*
* Author : Rahul
* Method Name : Language Selection
* Date : 14/07/2017
* Description :  Method used to check user language
*/
utility.language = function(userInfo){
    var constantmsg;
    if(userInfo && userInfo.selectedLanguage =='hw'){
        constantmsg = constantsObj.messageHw;
    }else{
        constantmsg = constantsObj.messageEn;
    }
return constantmsg;
}

utility.capitalizeFirstLetter = function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

utility.getEncryptText = function(text) {
    var cipher = crypto.createCipher(algorithm, password);
    text = cipher.update(text, 'utf8', 'hex');
    text += cipher.final('hex');
    return text;
}

utility.getDecryptText = function(text) {
    var decipher = crypto.createDecipher(algorithm, password);
    var text = decipher.update(text, 'hex', 'utf8');
    text += decipher.final('utf8');
    return text;
}

utility.encode = function(plain) {
    return  hashids.encode(parseInt(plain));
};

utility.decode = function(encoded) {
    var original = hashids.decode(encoded);
    if (typeof (original) === 'object') {
        return original[0];
    }
    return original;
};

utility.ensureAuthorized = function(req, res, next){
    var unauthorizedJson = {code: 401, 'message': 'Unauthorized', data: {}};
    var currentDate = moment.utc();
    if (req.headers.authorization) {
        var token = req.headers.authorization;
        var splitToken = token.split(' ');
        try {
            token = splitToken[1];
            var decoded = jwt.verify(token, constantsObj.config.secret);
            if (splitToken[0] == 'admin_bearer') {
                req.user = decoded;
                User.findById(req.user.uid).exec(function(err, User) {
                    if (err)
                        res.json(unauthorizedJson);
                    else if (!User)
                        res.json(unauthorizedJson);
                    else
                        next();
                });
            } else if (splitToken[0] == 'bearer') {
                User.findOne({ access_token: token, deleted: false }).exec(function(err, user) {
                    if (err || !user) {
                        res.json(unauthorizedJson);
                    } else {
                        req.user = user;
                        user.lastActivityTime = currentDate;
                        //console.log("User---> ensureAuthorized---->", user);
                        user.save();
                        next();
                    }
                });
            } else {
                res.json(unauthorizedJson);
            }
        } catch (err) {
            res.json(unauthorizedJson);
        }
    } else {
        res.json(unauthorizedJson);
    }
}


utility.readTemplateSendMail = function (to, subject, userData, templateFile, attachment_list, callback) {
    console.log("readTemplateSendMail", config.webUrl);
    if(attachment_list == ''){
        attachment_list = [];
    }
    var filePath = path.join(__dirname, '/templates/email/' + templateFile + '.html');
    fs.readFile(filePath, {
        encoding: 'utf-8'
    }, function (err, data) {
        if (!err) {
            var template = '';
            template = data
                .replace(/{baseUrl}/g, config.webUrl)
                .replace(/{email}/g, userData.email)
                .replace(/{firstname}/g, userData.firstname)
                .replace(/{lastname}/g, userData.lastname)
                .replace(/{password}/g, userData.password)
                .replace(/{visitId}/g, userData.visitId)
                .replace(/{verifying_token}/g, userData.verifying_token)
                .replace(/{username}/g, userData.username)
                .replace(/{surveyLink_Hw}/g, userData.surveyLink_Hw)
                .replace(/{surveyLink_En}/g, userData.surveyLink_En)
                

           if(userData.drFirstname &&  userData.drLastname &&  userData.patient_firstname && userData.patient_lastname){
               template = data
                .replace(/{drFirstname}/g, userData.drFirstname)
                .replace(/{drLastname}/g, userData.drLastname)
                .replace(/{patient_firstname}/g, userData.patient_firstname)
                .replace(/{patient_lastname}/g, userData.patient_lastname)
            }

            utility.sendmail(userData.email, subject, template, attachment_list, function (mailErr, resp) {
                if (err)
                    callback(mailErr);
                else
                    callback(null, true);
            });
        } else {
            callback(err);
        }
    });
}

utility.sendmail = function (to, subject, message, attachment_list, callback) {
    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: 'GMAIL',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'mcsi.healthcare@gmail.com',
            pass: 'Mcsi@123'
        }
    });
    if (attachment_list && attachment_list.length > 0) {
        //var filename = path.basename(attachment_filePath);
       // fs.readFile(attachment_filePath, function (err, data) {
            smtpTransport.sendMail({
                from: 'mcsi.healthcare@gmail.com',
                to: to,
                subject: subject,
                html: message,
               // attachments: [{ 'filename': filename, 'contents': data }]
               attachments: attachment_list
            }), function (err, success) {
                if (err) {
                    console.log(err, 'mail send Error');
                    callback(err);
                } else {
                    console.log('An e-mail has been sent to  with further instructions.');
                    callback(null, true);
                }
            }
      //  });
    }
    else {
        var mailOptions = {
            to: to,
            from: 'mcsi.healthcare@gmail.com',
            subject: subject,
            html: message
        };
        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                console.log(err, 'mail send Error');
                callback(err);
            } else {
                console.log('info', 'An e-mail has been sent to  with further instructions.');
                callback(null, true);
            }
        });
    }
};


utility.uploadImage = function(imageBase64, imageName, callback) {
    if (imageBase64 && imageName) {
        var timestamp = Number(new Date()); // current time as number
        var filename = +timestamp + '_' + imageName;
        var imagePath = "./public/assets/uploads/" + filename;
        fs.writeFile(path.resolve(imagePath), imageBase64, 'base64', function(err) {
            if (!err) {
                callback(config.webUrl + "/assets/uploads/" + filename);
            } else {
                callback(config.webUrl + "/assets/images/default-image.png");
            }
        });
    } else {
        callback(false);
    }
}

utility.fileExistCheck = function(path, callback) {
    fs.exists(path, function(err) {
        if (err) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

utility.validationErrorHandler = function(err) {
    var errMessage = constantsObj.validationMessages.internalError;
    if (err.errors) {
        for (var i in err.errors) {
            errMessage = err.errors[i].message;
        }
    }
    return errMessage;
}

utility.fileUpload = function(imagePath, buffer) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path.resolve(imagePath), buffer, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


utility.getSortObj = function(body) {
    var sorting = {_id: -1};
    for (var key in body) {
            var reg = new RegExp("sorting", 'gi');
            if (reg.test(key)) {
                var value = body[key];
                key = key.replace(/sorting/g, '').replace(/\[/g, '').replace(/\]/g, '');
                var sorting = {};
                sorting[key] = (value == 'desc') ? -1 : 1;
            }
    }
    return sorting;
}

utility.randomToken = function(length) {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
}

utility.getUserInfoByToken = function(header) {
    return new Promise(function(resolve, reject){
        var parts = header.authorization.split(' ');
        if (parts.length == 2) {
            User.findOne({
                access_token: parts[1],
            }, function(err, user) {
                if (err) {
                    reject(err);
                } else if (user) {
                    resolve(user);
                }
            });
        } else {
            reject(err);
        }
    });
};

/*
* Author : Swapnali Jare
* Method Name : fileExistCheck
* Date : 26/05/2017
* Description :  Method used to check file/dir exist in sync
*/
utility.fileExistCheck = function(path) {
     return new Promise(function(resolve, reject) {
         resolve(fs.existsSync(path));
    });
};

/*
* Author : Swapnali Jare
* Method Name : getFileStat
* Date : 26/05/2017
* Description :  Method used to get File Stat
*/
utility.getFileStat = function(path) {
     return new Promise(function(resolve, reject) {
         resolve(fs.statSync(path));
    });
};


/* Summary : Method used to create Dir at specified path */
utility.mkDirSync = function (path) {
    return new Promise(function(resolve, reject){
    if (path === null) {        
        reject(false);
    }
    resolve(fs.mkdirSync(path));
    });
};

/* Summary : Method used to create Dir at specified path */
utility.mkdirp = function (path) {
  return new Promise(function(resolve, reject){
    mkdirp(path, function(err){
        if (err) {
           reject(false);
        }
        else{
            resolve(true);
        }
    });
  });
};

/*
* Author : Swapnali Jare
* Method Name : ReadDirSync
* Date : 26/05/2017
* Description :  Method used to read directory in sync
*/
utility.ReadDirSync = function (path) {
    var ret = this.fileExistCheck(path);
    if (ret === true) {
        return fs.readdirSync(path);
    }
    return null;
};

/* Author : Swapnali Jare
* Method Name : ReadDirSync
* Date : 26/05/2017
* Description :  Method used to read directory in sync
*/
utility.writeFileSync = function (path, buffer) {
    return new Promise(function(resolve, reject){
        fs.writeFileSync(path, buffer);
        resolve(true);
    });
};
/*
* Author : Swapnali Jare
* Method Name : replaceUndefinedObjValToNull
* Date : 26/05/2017
* Description :  Method used to replace Undefined Object Value To Null
*/
utility.replaceUndefinedObjValToNull = function (obj) {
    for (var key in obj) {
        if (obj[key] === undefined) {
            obj[key] = '';
        }
    }
    return obj;
};

/*
* Author : Swapnali Jare
* Method Name : translateIntRefToHebrew
* Date : 26/05/2017
* Description :  Method used to replace xray and bloodtest to hebrew
*/
utility.translateIntRefToHebrew = function (type) {
    var typeInHebrew = '';
    if (type == 'XRAY') {
        typeInHebrew = 'רנטגן צילום';
    }
    else if (type == 'BLOODTEST') {
        typeInHebrew = 'בדיקת דם';
    }
    else if (type == 'URINETEST') {
        typeInHebrew = 'URINETEST';
    }
    return typeInHebrew;
};

utility.readFile = function (filePath) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Function is use to encrypt records 
 * @access private
 * @return json
 * Created by Sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 8-June-2017
 */
utility.encryptedRecord = function (data, field) {
    var patientObj = {};
    var fields = [];
    if (field.length > 0) {
        for (var i = 0; i < field.length; i++) {
            fields.push(field[i]);
        };
    }
    for (var key in data) {
        if (fields.indexOf(key) == -1) {
            if (data[key]) {
                if (data[key] instanceof Array) {
                    if (data[key].length > 0) {
                        patientObj[key] = [];
                        for (let j = 0; j < data[key].length; j++) {

                            patientObj[key][j] = {};

                            if (typeof(data[key][j]) == 'object') {

                                for (var arrObjkey in data[key][j]) {

                                    // console.log(arrObjkey,Object.keys(data[key][j]).length,"fdss");
                                    if (fields.indexOf(arrObjkey) == -1) {
                                        if (data[key][j][arrObjkey]) {
                                            // console.log('here',patientObj[key]);

                                            patientObj[key][j][arrObjkey] = utility.getEncryptText(data[key][j][arrObjkey].toString());

                                        }
                                    } else {
                                        patientObj[key][j][arrObjkey] = data[key][j][arrObjkey];
                                    }
                                }
                            } else if (typeof(result[key][j]) == 'string') {
                                patientObj[key][j] = utility.getEncryptText(result[key][j].toString());
                            }
                        }
                    } else {
                        patientObj[key] = data[key];
                    }
                } else {
                    patientObj[key] = utility.getEncryptText(data[key].toString());
                }
            }
        } else {
            patientObj[key] = data[key];
        }

    }
    return patientObj;
}


utility.encryptedRecordPromise = function(data, field) {
    return new Promise(function(resolve, reject) {
        utility.encryptedRecord(data, field, function(data2) {
            resolve(data2)
        });
    })
}

/**
 * Function is use to decrypt records 
 * @access private
 * @return json
 * Created by Sunny
 * @smartData Enterprises (I) Ltd
 * Created Date 8-June-2017
 */
utility.decryptedRecord = function (data, field,callback1) {
    //console.log("4444",data);   
    var newArr = [];
    var fields = ['_id', 'createdAt', 'updatedAt', 'is_deleted', 'status', '__v'];
    if (field.length > 0) {
        for (var i = 0; i < field.length; i++) {
            fields.push(field[i]);
        };
    }
    if (data instanceof Array) {
        async.each(data, function(result, callback) {
            var patientObj = {};
            for (var key in result) {
                if (fields.indexOf(key) == -1) {
                    if (result[key]) {
                        //console.log('****ddd****',typeof(result[key]));
                        if (result[key] instanceof Array) {
                           // console.log('********',335433453453);
                            if (result[key].length > 0) {
                                patientObj[key] = [];
                                for (let j = 0; j < result[key].length; j++) {
                                    patientObj[key][j] = {};
                                    if (typeof(result[key][j]) == 'object') {
                                        for (var arrObjkey in result[key][j]) {
                                            if (fields.indexOf(arrObjkey) == -1) {
                                                if (result[key][j][arrObjkey]) {
                                                    patientObj[key][j][arrObjkey] = utility.getDecryptText(result[key][j][arrObjkey].toString());
                                                }
                                            } else {
                                                patientObj[key][j][arrObjkey] = result[key][j][arrObjkey];
                                            }
                                        }
                                    } else if (typeof(result[key][j]) == 'string') {
                                        patientObj[key][j] = utility.getDecryptText(result[key][j].toString());
                                    }
                                }
                            } else {
                                patientObj[key] = result[key];
                            }

                        }else {
                           //console.log('****mmmm****',patientObj);
                            patientObj[key] = utility.getDecryptText(result[key].toString());
                            //console.log('****ccc****',patientObj);
                        }
                    }
                } else {
                    patientObj[key] = result[key];
                }
                //console.log('33333333',patientObj);
            }

           // console.log('88888888888',patientObj);   
        newArr.push(patientObj);
            callback(null);
        }, function(err) {
            callback1(newArr)
        });
    } else {
        var patientObj = {};
       // console.log("#######")
        for (var key in data) {
            if (fields.indexOf(key) == -1) {
                if (data[key]) {
                  //  console.log('*****AAAA***',typeof(data[key]));
                    if (data[key] instanceof Array) {
                        if (data[key].length > 0) {
                            patientObj[key] = [];
                            for (let j = 0; j < data[key].length; j++) {

                                patientObj[key][j] = {};

                                if (typeof(data[key][j]) == 'object') {

                                    for (var arrObjkey in data[key][j]) {

                                        // console.log(arrObjkey,Object.keys(data[key][j]).length,"fdss");
                                        if (fields.indexOf(arrObjkey) == -1) {
                                            if (data[key][j][arrObjkey]) {
                                                // console.log('here',patientObj[key]);

                                                patientObj[key][j][arrObjkey] = utility.getDecryptText(data[key][j][arrObjkey].toString());

                                            }
                                        } else {
                                            patientObj[key][j][arrObjkey] = data[key][j][arrObjkey];
                                        }
                                    }
                                } else if (typeof(result[key][j]) == 'string') {
                                    patientObj[key][j] = utility.getDecryptText(result[key][j].toString());
                                }
                            }
                        } else {
                            
                                                      
                            patientObj[key] = data[key];
                        }
                    } else {
                        //console.log('HHHHHH',data[key]); 
                        patientObj[key] = utility.getDecryptText(data[key].toString());
                       // console.log('BBBA',patientObj);
                    }
                }
            } else {
                patientObj[key] = data[key];
            }
        }
       // console.log('-------------------------------------------------->>>>>>',patientObj)
         callback1(patientObj);
    }
}

utility.getModifiedDetailsForAuditLog = function (oldObj, newObj, isNewObject) {
  
    var modifiedDetails = [];
    if (isNewObject) {
        for (var property in newObj) {
            if (newObj.hasOwnProperty(property)) {
                modifiedDetails.push({
                    "newValue": newObj[property],
                    "oldValue": '',
                    "name": property
                })
            }
        }
    }
    else {
        for (var oldProperty in oldObj) {
             
            if (oldObj.hasOwnProperty(oldProperty)) {
                for (var newProperty in newObj) {
                    
                    if (oldProperty == newProperty) {
                         console.log('in if');
                        modifiedDetails.push({
                            "newValue": newObj[newProperty],
                            "oldValue": oldObj[oldProperty],
                            "name": oldProperty
                        })
                          break;
                    }
                }
            }
        }
    }
    return modifiedDetails;
};

 
/*
* Author : Swapnali Jare
* Method Name : convertStringToDateObject
* Date : 14/07/2017
* Description :  convert string to moment date object
*/
utility.convertStringToDateObject = function (dateTimeString) {
    var dateTime = '';
    dateTimeString = (dateTimeString).split(" ");
    var date = dateTimeString[0];
    var time = dateTimeString[1] + " " + dateTimeString[2];
   // console.log("date--->" + date + "------ time--->" + time);
    time = moment(time, ["h:mm A"]).format("HH:mm");
    var dateTime = moment(date + ' ' + time, 'DD/MM/YYYY HH:mm');
  //  console.log("After date--->" + date + "------ After time--->" + time);
  //  console.log("dateTime-------->", dateTime);
    return dateTime;
};

/*
* Author : Swapnali Jare
* Method Name : dayOfWeekAsInteger
* Date : 14/07/2017
* Description :  get day of week
*/
utility.dayOfWeekAsInteger = function(day) {
 console.log("Day--->", day);
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(day);
}

utility.getDayIndexArray = function (startIndex, endIndex) {
    console.log("startIndex--->" + startIndex + "----endIndex---" + endIndex);
    var i = startIndex;
    var j = endIndex;
    var myDays = [];
    if (j < i) {
        while (i < 7) {
            myDays.push(i);
            i++;
        }
        while (j > -1) {
            myDays.push(j);
            j--;
        }
        console.log(myDays);
    }
    return myDays;
}


module.exports = utility;


























// 'use strict';
// /*
//  * Utility - utility.js
//  * Author: smartData Enterprises
//  * Date: 3rd Jan 2017
//  */
// var jwt = require('jsonwebtoken');
// var constantsObj = require('./../../constants');
// var crypto = require('crypto'),
//     algorithm = constantsObj.config.cryptoAlgorithm,
//     password = constantsObj.config.cryptoPassword;
// var nodemailer = require('nodemailer');
// var fs = require("fs");
// var path = require('path');
// var config = require('../../config/config.js');
// var nodemailer = require('nodemailer');
// var async = require('async');
// var User = require('../models/users');
// var Hashids = require("hashids");
// var hashids = new Hashids(config.SALTKEY);
// var mkdirp = require('mkdirp');


// var utility = {};

// // module.exports = {
// //         ensureAuthorized: ensureAuthorized
// //  }

// utility.capitalizeFirstLetter = function capitalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

// utility.getEncryptText = function(text) {
//     var cipher = crypto.createCipher(algorithm, password);
//     text = cipher.update(text, 'utf8', 'hex');
//     text += cipher.final('hex');
//     return text;
// }

// utility.getDecryptText = function(text) {
//     var decipher = crypto.createDecipher(algorithm, password);
//     var text = decipher.update(text, 'hex', 'utf8');
//     text += decipher.final('utf8');
//     return text;
// }

// utility.encode = function(plain) {
//     return  hashids.encode(parseInt(plain));
// };

// utility.decode = function(encoded) {
//     var original = hashids.decode(encoded);
//     if (typeof (original) === 'object') {
//         return original[0];
//     }
//     return original;
// };

// utility.ensureAuthorized = function(req, res, next){
//     var unauthorizedJson = {code: 401, 'message': 'Unauthorized', data: {}};
//     if (req.headers.authorization) {
//         var token = req.headers.authorization;
//         var splitToken = token.split(' ');
//         try {
//             token = splitToken[1];
//             var decoded = jwt.verify(token, constantsObj.config.secret);
//             if (splitToken[0] == 'admin_bearer') {
//                 req.user = decoded;
//                 User.findById(req.user.uid).exec(function(err, User) {
//                     if (err)
//                         res.json(unauthorizedJson);
//                     else if (!User)
//                         res.json(unauthorizedJson);
//                     else
//                         next();
//                 });
//             } else if (splitToken[0] == 'bearer') {
//                 User.findOne({ access_token: token, deleted: false }).exec(function(err, user) {
//                     if (err || !user) {
//                         res.json(unauthorizedJson);
//                     } else {
//                         req.user = user;
//                         next();
//                     }
//                 });
//             } else {
//                 res.json(unauthorizedJson);
//             }
//         } catch (err) {
//             res.json(unauthorizedJson);
//         }
//     } else {
//         res.json(unauthorizedJson);
//     }
// }

// // utility.readTemplateSendMail = function(to, subject, userData, templateFile, callback) {
// //     var filePath = path.join(__dirname, '/email_templates/' + templateFile + '.html');
// //     fs.readFile(filePath, {
// //         encoding: 'utf-8'
// //     }, function(err, data) {
// //         if (!err) {
// //             var template = data
// //                 .replace(/{baseUrl}/g, config.webUrl)
// //                 .replace(/{email}/g, userData.email)
// //                 .replace(/{firstname}/g, userData.firstname)
// //                 .replace(/{lastname}/g, userData.lastname)
// //                 .replace(/{password}/g, userData.password)
// //                // .replace(/{verifying_token}/g, userData.verifying_token);

// //             utility.sendmail(userData.email, subject, template, function(mailErr, resp) {
// //                 if (err)
// //                     callback(mailErr);
// //                 else
// //                     callback(null, true);
// //             });
// //         } else {
// //             callback(err);
// //         }
// //     });
// // }

// // utility.sendmail = function(to, subject, message, callback) {
// //     var smtpTransport = nodemailer.createTransport("SMTP", {
// //         service: 'GMAIL',
// //         host: 'smtp.gmail.com',
// //         port: 465,
// //         secure: true,
// //         auth: {
// //             user: 'neobook.app@gmail.com',
// //             pass: 'neobook@123'
// //         }
// //     });

// //     var mailOptions = {
// //         to: to,
// //         from: 'neobook.app@gmail.com',
// //         subject: subject,
// //         html: message
// //     };
// //     smtpTransport.sendMail(mailOptions, function(err) {
// //         if (err) {
// //             console.log(err, 'mail send Error');
// //             callback(err);
// //         } else {
// //             console.log('info', 'An e-mail has been sent to  with further instructions.');
// //             callback(null, true);
// //         }
// //     });
// // }
// //console.log("readTemplateSendMail", config.webUrl);
// utility.readTemplateSendMail = function (to, subject, userData, templateFile, attachment_list, callback) {
//     console.log("readTemplateSendMail", config.webUrl);
//     if(attachment_list == ''){
//         attachment_list = [];
//     }
//     var filePath = path.join(__dirname, '/templates/email/' + templateFile + '.html');
//     fs.readFile(filePath, {
//         encoding: 'utf-8'
//     }, function (err, data) {
//         if (!err) {
//             var template = '';
//             template = data
//                 .replace(/{baseUrl}/g, config.webUrl)
//                 .replace(/{email}/g, userData.email)
//                 .replace(/{firstname}/g, userData.firstname)
//                 .replace(/{lastname}/g, userData.lastname)
//                 .replace(/{password}/g, userData.password)
//                 .replace(/{visitId}/g, userData.visitId)
//                 .replace(/{verifying_token}/g, userData.verifying_token)
//                 .replace(/{username}/g, userData.username);

//            if(userData.drFirstname &&  userData.drLastname &&  userData.patient_firstname && userData.patient_lastname){
//                template = data
//                 .replace(/{drFirstname}/g, userData.drFirstname)
//                 .replace(/{drLastname}/g, userData.drLastname)
//                 .replace(/{patient_firstname}/g, userData.patient_firstname)
//                 .replace(/{patient_lastname}/g, userData.patient_lastname)
//             }

//             utility.sendmail(userData.email, subject, template, attachment_list, function (mailErr, resp) {
//                 if (err)
//                     callback(mailErr);
//                 else
//                     callback(null, true);
//             });
//         } else {
//             callback(err);
//         }
//     });
// }

// utility.sendmail = function (to, subject, message, attachment_list, callback) {
//     var smtpTransport = nodemailer.createTransport("SMTP", {
//         service: 'GMAIL',
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//             user: 'mcsi.healthcare@gmail.com',
//             pass: 'Mcsi@123'
//         }
//     });
//     if (attachment_list && attachment_list.length > 0) {
//         //var filename = path.basename(attachment_filePath);
//        // fs.readFile(attachment_filePath, function (err, data) {
//             smtpTransport.sendMail({
//                 from: 'mcsi.healthcare@gmail.com',
//                 to: to,
//                 subject: subject,
//                 html: message,
//                // attachments: [{ 'filename': filename, 'contents': data }]
//                attachments: attachment_list
//             }), function (err, success) {
//                 if (err) {
//                     console.log(err, 'mail send Error');
//                     callback(err);
//                 } else {
//                     console.log('An e-mail has been sent to  with further instructions.');
//                     callback(null, true);
//                 }
//             }
//       //  });
//     }
//     else {
//         var mailOptions = {
//             to: to,
//             from: 'mcsi.healthcare@gmail.com',
//             subject: subject,
//             html: message
//         };
//         smtpTransport.sendMail(mailOptions, function (err) {
//             if (err) {
//                 console.log(err, 'mail send Error');
//                 callback(err);
//             } else {
//                 console.log('info', 'An e-mail has been sent to  with further instructions.');
//                 callback(null, true);
//             }
//         });
//     }
// };


// utility.uploadImage = function(imageBase64, imageName, callback) {
//     if (imageBase64 && imageName) {
//         var timestamp = Number(new Date()); // current time as number
//         var filename = +timestamp + '_' + imageName;
//         var imagePath = "./public/assets/uploads/" + filename;
//         fs.writeFile(path.resolve(imagePath), imageBase64, 'base64', function(err) {
//             if (!err) {
//                 callback(config.webUrl + "/assets/uploads/" + filename);
//             } else {
//                 callback(config.webUrl + "/assets/images/default-image.png");
//             }
//         });
//     } else {
//         callback(false);
//     }
// }

// utility.fileExistCheck = function(path, callback) {
//     fs.exists(path, function(err) {
//         if (err) {
//             callback(true);
//         } else {
//             callback(false);
//         }
//     });
// }

// utility.validationErrorHandler = function(err) {
//     var errMessage = constantsObj.validationMessages.internalError;
//     if (err.errors) {
//         for (var i in err.errors) {
//             errMessage = err.errors[i].message;
//         }
//     }
//     return errMessage;
// }

// utility.fileUpload = function(imagePath, buffer) {
//     return new Promise(function(resolve, reject) {
//         fs.writeFile(path.resolve(imagePath), buffer, function(err) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }


// utility.getSortObj = function(body) {
//     var sorting = {_id: -1};
//     for (var key in body) {
//             var reg = new RegExp("sorting", 'gi');
//             if (reg.test(key)) {
//                 var value = body[key];
//                 key = key.replace(/sorting/g, '').replace(/\[/g, '').replace(/\]/g, '');
//                 var sorting = {};
//                 sorting[key] = (value == 'desc') ? -1 : 1;
//             }
//     }
//     return sorting;
// }

// utility.randomToken = function(length) {
//     var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
//     var pass = "";
//     for (var x = 0; x < length; x++) {
//         var i = Math.floor(Math.random() * chars.length);
//         pass += chars.charAt(i);
//     }
//     return pass;
// }

// utility.getUserInfoByToken = function(header) {
//     return new Promise(function(resolve, reject){
//         var parts = header.authorization.split(' ');
//         if (parts.length == 2) {
//             User.findOne({
//                 access_token: parts[1],
//             }, function(err, user) {
//                 if (err) {
//                     reject(err);
//                 } else if (user) {
//                     resolve(user);
//                 }
//             });
//         } else {
//             reject(err);
//         }
//     });
// };

// /*
// * Author : Swapnali Jare
// * Method Name : fileExistCheck
// * Date : 26/05/2017
// * Description :  Method used to check file/dir exist in sync
// */
// utility.fileExistCheck = function(path) {
//      return new Promise(function(resolve, reject) {
//          resolve(fs.existsSync(path));
//     });
// };

// /*
// * Author : Swapnali Jare
// * Method Name : getFileStat
// * Date : 26/05/2017
// * Description :  Method used to get File Stat
// */
// utility.getFileStat = function(path) {
//      return new Promise(function(resolve, reject) {
//          resolve(fs.statSync(path));
//     });
// };


// /* Summary : Method used to create Dir at specified path */
// utility.mkDirSync = function (path) {
//     return new Promise(function(resolve, reject){
//     if (path === null) {        
//         reject(false);
//     }
//     resolve(fs.mkdirSync(path));
//     });
// };

// /* Summary : Method used to create Dir at specified path */
// utility.mkdirp = function (path) {
//   return new Promise(function(resolve, reject){
//     mkdirp(path, function(err){
//         if (err) {
//            reject(false);
//         }
//         else{
//             resolve(true);
//         }
//     });
//   });
// };

// /*
// * Author : Swapnali Jare
// * Method Name : ReadDirSync
// * Date : 26/05/2017
// * Description :  Method used to read directory in sync
// */
// utility.ReadDirSync = function (path) {
//     var ret = this.fileExistCheck(path);
//     if (ret === true) {
//         return fs.readdirSync(path);
//     }
//     return null;
// };

// /* Author : Swapnali Jare
// * Method Name : ReadDirSync
// * Date : 26/05/2017
// * Description :  Method used to read directory in sync
// */
// utility.writeFileSync = function (path, buffer) {
//     return new Promise(function(resolve, reject){
//         fs.writeFileSync(path, buffer);
//         resolve(true);
//     });
// };
// /*
// * Author : Swapnali Jare
// * Method Name : replaceUndefinedObjValToNull
// * Date : 26/05/2017
// * Description :  Method used to replace Undefined Object Value To Null
// */
// utility.replaceUndefinedObjValToNull = function (obj) {
//     for (var key in obj) {
//         if (obj[key] === undefined) {
//             obj[key] = '';
//         }
//     }
//     return obj;
// };

// /*
// * Author : Swapnali Jare
// * Method Name : translateIntRefToHebrew
// * Date : 26/05/2017
// * Description :  Method used to replace xray and bloodtest to hebrew
// */
// utility.translateIntRefToHebrew = function (type) {
//     var typeInHebrew = '';
//     if (type == 'XRAY') {
//         typeInHebrew = 'רנטגן צילום';
//     }
//     else if (type == 'BLOODTEST') {
//         typeInHebrew = 'בדיקת דם';
//     }
//     return typeInHebrew;
// };

// utility.readFile = function (filePath) {
//     return new Promise(function (resolve, reject) {
//         fs.readFile(filePath, function (err, data) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(data);
//             }
//         });
//     });
// }

// module.exports = utility;
