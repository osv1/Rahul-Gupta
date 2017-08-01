'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var DiseaseSchema = new mongoose.Schema({
    name: { type: String, required: true},
    nurseTest: [{
         
    }],
    doctorTest:  [{
     
    }],
    indexValueType: { type: String}, //Type(Boolean/Numeric)
    indexType:{ type: String, enum: ['Disease', 'Triage'], default: 'Disease' },
    minRange: { type: Number },
    maxRange: { type: Number },
    value: { type: String },
    alertFreqency: { type: Number },
    indexDescription:  { type: String},
}, {
    timestamps: true
});


DiseaseSchema.statics.existCheck = function(name, id, callback) {
    var where = {};
    if (id) {
        where = {
            $or: [ { name: new RegExp('^' + name + '$', "i") }], deleted: { $ne: true }, _id: { $ne: id }};
    } else {
        where = {$or: [ { name: new RegExp('^' + name + '$', "i") }], deleted: { $ne: true }};
    }
    Disease.findOne(where, function(err, diseasedata) {
        if (err) {
            callback(err);
        } else {
            if (diseasedata) {
                callback(null, constantsObj.validationMessages.diseaseAlreadyExist);
            } else {
                callback(null, true);
            }
        }
    });
};

var Disease = mongoose.model('Disease', DiseaseSchema);
module.exports = Disease;
    

// var DiseaseSchema = new mongoose.Schema({
//     name: { type: String, required: true},
//     indexType: { type: String, required: true}, //Type(Boolean/Numeric)
//     minRange: { type: Number },
//     maxRange: { type: Number },
//     alertFreqency: { type: Number },
//     indexDescription:  { type: String, required: true},
// }, {
//     timestamps: true
// });

// 'use strict';

// var mongoose = require('mongoose'),
//         constantsObj = require('./../../constants');
// var Schema = mongoose.Schema;

// var UserSchema = new mongoose.Schema({
//     firstname: { type: String, required: true},
//     lastname: { type: String, required: true},
//     email: { type: String, required: true},
//     fb_token: { type: String},
//     password: { type: String, require: true },
//     institute: { type: Schema.Types.ObjectId, ref: 'Institute' },
//     verifying_token: { type: String},
//     QB_username: { type: String},//Quick bloq username
//     QB_password: { type: String},//Quick bloq password
//     QB_id: { type: String},//Quick bloq id
//     email: { type: String, required: true},    
//     // token: { type: String},
//     profile_image: { type: String},
//     deviceInfo: [{
//         deviceType: { type: String},
//         deviceId: { type: String},
//         deviceToken: { type: String},
//         access_token: { type: String},
//     }],
//     status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
//     deleted: {
//         type: Boolean,
//         default: false
//     }
// }, {
//     timestamps: true
// });


// UserSchema.statics.existCheck = function(email, id, callback) {
//     var where = {};
//     if (id) {
//         where = {
//             $or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }, _id: { $ne: id }};
//     } else {
//         where = {$or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }};
//     }
//     User.findOne(where, function(err, userdata) {
//         if (err) {
//             callback(err)
//         } else {
//             if (userdata) {
//                 callback(null, constantsObj.validationMessages.emailAlreadyExist);
//             } else {
//                 callback(null, true);
//             }
//         }
//     });
// };

// UserSchema.statics.addDevice = function(email, id, callback) {
    
// };

// var User = mongoose.model('User', UserSchema);
// module.exports = User;
    
//     {
//   "firstname": "swapnali",
//   "lastname": "jare",
//   "fatherName": "jalinder",
//   "age": "26",
//   "kupatCholim": "string",
//   "DOB": "13/10/1991",
//   "email": "v2swapnali",
//   "city": "nagpur",
//   "address": "nagpur",
//   "mobileNo": "123456789",
//   "familyDoctorId": "1222",
//   "medicalHistory": "sed sed",
//   "allergies": "milk"
// }
