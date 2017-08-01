'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;
// by sunny on 2 may some changes  
var patientProfileSchema = new mongoose.Schema({
    patientId: { type: String},
    firstname: { type: String, required: [true, 'Firstname is required']},
    lastname: { type: String, required: [true, 'Lastname is required']},
    name: { type: String},
    fatherName: { type: String},
    motherName: { type: String},
    age: { 
        year: {type: Number},
        month: {type: Number},
        day:{type: Number}
         },
    gender:{type:String,required:[true,'Gender is required']},
    // kupatCholim : { type: Schema.Types.ObjectId, ref: 'KupatCholim' },
    kupatCholim : { type: Schema.Types.ObjectId, ref: 'Kupat' },
    DOB: { type: String, required: [true, 'Date Of Birth is required']},
    email: { type: String},
    address: { type: String, required: [true, 'Address is required']},
    city: { type: String,  required: [true, 'City is required']},
    mobileNo :  { type: String, required: [true, 'Mobile Number is required']},
    secondaryNo :  { type: String},
    status: { type: Number, default: 0 },
    fileName :{ type : String},
    comment:{type:String},
    familyDoctorId: { type: Schema.Types.ObjectId, ref: 'User' },  //populate mixture of all mangement doctor + familt doctor till now
    medicalHistory: { type: String},
    allergies: [{
			type:String		
		}], 
    isPersonnel: { type: Boolean,  default: false }	
   // stage:  { type: String},  //patient stage need to be update on every stage change
}, {
    timestamps: true
});

var Patient = mongoose.model('Patient', patientProfileSchema);
module.exports = Patient;

