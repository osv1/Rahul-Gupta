'use strict';

var mongoose = require('mongoose'),
    Role = mongoose.model('Role'),
    Response = require('../lib/response.js'),
    slug = require('slug');

module.exports = {
    getRoles: getRoles,
    addRole: addRole,
    getRoleById: getRoleById,
    updateRole: updateRole,
    //TODO:
    //deleteRole: deleteRole,
    updatePermission: updatePermission
};

/**
 * Function is use to get roles
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 4-May-2017
 */
function getRoles(req, res) {
    //console.log('GetROles', getRoles);
    Role.find({
        status: true,
        deleted: false
    }, function(err, data) {
         //console.log('GetROles', data);
        if (err || data.length === 0) {
            res.json({
                'code': 402,
                'message': 'Unable to get role'
            });
        } else {
            res.json({
                'code': 200,
                'data': data
            });
        }
    });
}

/**
 * Function is use to add role
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 4-May-2017
 */
function addRole(req, res) {
    var body = req.body;
    if (!body.title) {
        res.json({
            'code': 402,
            'message': 'Required fields are missing'
        });
    } else {
        Role.existCheck(body.title, '', function(err, exist) {
            if (err) {
                res.json({
                    'code': 402,
                    'message': 'Something went wrong please try again!'
                });
            } else {
                if (exist) {
                   // res.json(Response(402, "failed", utility.validationErrorHandler(err), err));
                    res.json(Response(402, "failed", 'Title already exist please try another!'));
                    // res.json({
                    //     'code': 402,
                    //     'message': 'Title already exist please try another!'
                    // });
                } else {
                    var role = new Role();
                    role.name = slug(body.title, '_').toLowerCase();
                    role.title = body.title;
                    if (req.body.description) {
                        role.description = req.body.description;
                    }
                    role.save(function(err, data) {
                        if (err) {
                            res.json({
                                'code': 402,
                                'message': 'Something went wrong please try again!'
                            });
                        } else {
                            res.json({
                                'code': 200,
                                'message': 'Role added successfully'
                            });
                        }
                    });
                }
            }
        });
    }
}

/**
 * Function is use to get role by id
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 4-May-2017
 */
function getRoleById(req, res) {
   //console.log('getRoleByid',  req.swagger.params.id.value);
  var body = req.body;
  var id = req.swagger.params.id.value;
   Role.findById(id, '', function(err, data) {
        if (err || !data) {
            res.json({
                'code': 402,
                'message': 'Unable to get Role'
            });
        } else {
            res.json({
                'code': 200,
                'data': data
            });
        }
    });
}

/**
 * Function is use update role
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 4-May-2017
 */
function updateRole(req, res) {
   var id = req.swagger.params.id.value;
    var body = req.body;
    if (!body.title) {
        res.json({
            'code': 402,
            'message': 'Required fields are missing'
        });
    } else {
        Role.findOne({_id: id, deleted: false}, function(err, data) {
            if (err || !data) {
                res.json({
                    'code': 402,
                    'message': 'Unable to get Role'
                });
            } else {
                Role.existCheck(body.title, data._id, function(err, exist) {
                    if (err) {
                        res.json({
                            'code': 402,
                            'message': 'Something went wrong please try again!'
                        });
                    } else {
                        if (exist) {
                            res.json({
                                'code': 402,
                                'message': 'Title already exist please try another!'
                            });
                        } else {
                            data.title = body.title;
                            data.name = slug(body.title, '_').toLowerCase();
                            if (req.body.description) {
                                data.description = req.body.description;
                            }
                            data.save(function(err, result) {
                                if (err || !result) {
                                    res.json({
                                        'code': 402,
                                        'message': 'Something went wrong please try again!'
                                    });
                                } else {
                                    res.json({
                                        'code': 200,
                                        'data': result
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    }
}


//TODO
// function deleteRole(req, res) {
//     //var id = req.swagger.params.id.value;
//     var body = req.body;
//    var id = req.body.id;
//     Role.findOne({ _id: id, deleted: false }, function(err, data) {
//         if (err || !data) {
//             res.json({
//                 'code': 402,
//                 'message': 'Unable to get Role'
//             });
//         } else {
//             data.deleted = true;
//             data.save(function(err, result) {
//                 if (err || !result) {
//                     res.json({
//                         'code': 402,
//                         'message': 'Something went wrong please try again!'
//                     });
//                 } else {
//                     res.json({
//                         'code': 200,
//                         'message': 'Role deleted successfully'
//                     });
//                 }
//             });
//         }
//     });
// }

/**
 * Function is use to update permission of role
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 4-May-2017
 */
//id: role _id
//permission_id is array 
function updatePermission(req, res) {
    var id = req.swagger.params.id.value;
    var body = req.body;
    if (!id || !req.body.permission_id) {
        res.json({
            'code': 400,
            'message': 'Required fields are missing'
        });
    } else {
        Role.findOne({_id: id, deleted: false}, function(err, data) {
            if (err || !data) {
                res.json({
                    'code': 404,
                    'message': 'Unable to get Role'
                });
            } else {
                data.permission_id = [];
                data.save(function(err, result) {
                    if (err || !result) {
                        res.json({
                            'code': 402,
                            'message': 'Something went wrong please try again!'
                        });
                    } else {
                        result.permission_id = body.permission_id;
                        result.save(function(err, resultResp) {
                            if (err || !resultResp) {
                                res.json({
                                    'code': 402,
                                    'message': 'Something went wrong please try again!'
                                });
                            } else {
                                res.json({
                                    'code': 200,
                                    'message': 'Permission updated successfully'
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}
