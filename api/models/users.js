'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
    //by sunny change on 27/april/2017 
    firstname: { type: String,required: true},
    lastname: { type: String, required: true},
    username: { type: String },
    email: { type: String, required: true},
    password: { type: String, default:'123456'},
    verifying_token: { type: String},
    Address: { type: String, required: true}, 
    city: { type: String}, 
    profile_image: { type: String},
    profileName :{ type : String,default: '1496375001457.png'},
    mobileNo :  { type: String, required: true},
    teleNo: { type: String, required: true},
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    role_id: { type: Schema.Types.ObjectId, ref: 'Role'},
    userType: { type: String},   // need to remove later
    deleted: {
        type: Boolean,
        default: false
    },
    access_token: { type: String},
    selectedLanguage: { type: String},
    
    KupatCholim : { type: Schema.Types.ObjectId, ref: 'Kupat'},   //need only with family doctor
    patientWaitingCount: { type: Number },   //need for only role doctor
    isFamilyDoctor: { type: Number, default: 0},
    homeToken: { type: String},
    isverified:{ type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    loggedInTime: { type: Date },
    lastActivityTime: { type: Date }
},{
    timestamps: true,
    toObject: {
    virtuals: true
    },
    toJSON: {
    virtuals: true 
    }
});

UserSchema.virtual('full').get(function () {
  return this.firstname + ' ' + this.lastname;
});

UserSchema.statics.existCheck = function(email, id, callback) {
    var where = {};
    if (id) {
        where = {
            $or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }, _id: { $ne: id }};
    } else {
        where = {$or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }};
    }
    User.findOne(where, function(err, userdata) {
        if (err) {
            callback(err);
        } else {
            if (userdata) {
                callback(null, constantsObj.validationMessages.emailAlreadyExist);
            } else {
                callback(null, true);
            }
        }
    });
};

var User = mongoose.model('User', UserSchema);
module.exports = User;
    
