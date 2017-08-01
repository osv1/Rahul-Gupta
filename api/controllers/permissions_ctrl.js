'use strict';

var mongoose = require('mongoose'),
    Permission = mongoose.model('Permission'),
    User = mongoose.model('User'),
    async = require('async');

module.exports = {
      getPermissions: getPermissions,
      getUserPermissions: getUserPermissions,
     //createPermission: createPermission
};

/**
 * [getUsers - get permissions ]
 * @param  {object} req
 * @param  {object} res
 * @return {json}
 */
function getPermissions(req, res) {
    Permission.find({
        status: true,
        deleted: false
    }, function(err, data) {
        if (err || !data) {
            res.json({
                'code': 402,
                'message': 'Unable to get permissions'
            });
        } else {
            res.json({
                'code': 200,
                'data': data
            });
        }

    });
}

//TODO
// function getUserPermissions(req, res) {
//    console.log('--------------------in getpermission check---------------------');
//    console.log("----Request-----", req.headers);
//    var permissionArray = [];
//    if (req.headers.authorization) {
//         var parts = req.headers.authorization.split(' ');
//         if (parts.length == 2) {
//             User.findOne({
//                 access_token: parts[1],
//             }).populate('role_id').exec(function (err, user) {
//                 console.log("user--->", user);
//                 if (err || !user) {
//                     res.json({
//                         'code': 402,
//                         'message': 'Authentication failed'
//                     });
//                 } else {
//                     if(user.role_id && user.role_id.permission_id && user.role_id.permission_id.length != 0){
//                     var permissionIdArray = user.role_id.permission_id;
//                     console.log("---permissionIdArray---", permissionIdArray);
                    
//                     async.forEachSeries(permissionIdArray, function (permissionId, callback) {
//                          Permission.findOne({ _id: permissionId}).exec(function(err, permission){
//                              if (err) {
//                                 callback();
//                              } else {
//                                  if(permission){
//                                       permissionArray.push(permission.name);
//                                       callback();
//                                  }
//                              }
//                          });
//                     }, function (err) {
//                          console.log("---permissionArray---", permissionArray);
//                         res.json({
//                             'code': 200,
//                             'data': {
//                                 permissions: permissionArray
//                             }
//                         });
//                     });
//                     }
//                     else{
//                           res.json({
//                             'code': 200,
//                             'data': {
//                                 permissions: permissionArray
//                             }
//                         });
//                     }
//                 }
//             });
//         } else {
//             res.json({
//                 'code': 402,
//                 'message': 'Authentication failed'
//             });
//         }
//     } else {
//         res.json({
//             'code': 402,
//             'message': 'Authentication failed'
//         });
//     }
// }

//TODO
/**
 * Create product group
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
// function createPermission(req, res) {
//     var body = req.body;
//     if (!req.body.title || !req.body.name) {
//         res.json({
//             'code': 402,
//             'message': 'Required fields are missing'
//         });
//     } else {
//         var prmi = new Permission();
//         prmi.title = body.title;
//         prmi.name = body.name;
//         prmi.save(function(err, data) {
//             if (err) {
//                 res.json({
//                     'code': 402,
//                     'message': 'Something went wrong please try again!'
//                 });
//             } else {
//                 res.json({
//                     'code': 200,
//                     'message': 'Permission successfully'
//                 });
//             }
//         });
//     }
// }
 function getUserPermissions(req, res) {
   console.log('--------------------in getpermission check---------------------');
   //console.log("----Request-----", req.headers);
   var permissionArray = [];
   if (req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length == 2) {
            User.findOne({
                access_token: parts[1],
            }).populate('role_id').exec(function (err, user) {
              //  console.log("user--->", user);
                if (err || !user) {
                    res.json({
                        'code': 402,
                        'message': 'Authentication failed'
                    });
                } else {
                    if(user.role_id && user.role_id.permission_id && user.role_id.permission_id.length != 0){
                    var permissionIdArray = user.role_id.permission_id;
                  //  console.log("---permissionIdArray---", permissionIdArray);
                    
                    async.forEachSeries(permissionIdArray, function (permissionId, callback) {
                       //  console.log("permissionId:--", permissionId);
                         Permission.findOne({ _id: permissionId}).exec(function(err, permission){
                             if (err) {
                             //    console.log("err:--", err);
                                callback();
                             } else {
                                 if(permission){
                                       // console.log("permission:--", permission);
                                      permissionArray.push(permission.name);
                                        //console.log("permissionArray:--", permissionArray);
                                      callback();
                                 }
                                 else{
                                      callback();
                                 }
                             }
                         });
                    }, function (err) {
                       //  console.log("---permissionArray---", permissionArray);
                        res.json({
                            'code': 200,
                            'data': {
                                permissions: permissionArray
                            }
                        });
                    });
                    }
                    else{
                          res.json({
                            'code': 200,
                            'data': {
                                permissions: permissionArray
                            }
                        });
                    }
                }
            });
        } else {
            res.json({
                'code': 402,
                'message': 'Authentication failed'
            });
        }
    } else {
        res.json({
            'code': 402,
            'message': 'Authentication failed'
        });
    }
}
