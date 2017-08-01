'use strict';

var mongoose = require('mongoose'),
constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var VisitInfoSchema = new mongoose.Schema({
    //VisitReason page
    patientId:{ type: Schema.Types.ObjectId, ref: 'Patient' },
    visitStart: { type: Date},
    visitEnd: { type: Date},
    visitDuration: { type: String},
    visitReason: { type: String},
    isUrgent: { type: Boolean, default: false}, 
    allergies : [],

    //VisitDetails page
    mainComplaint : { type: String},
    medicalHistory : { type: String},
    currentdisease:{ type: String}, //for doctorExam page 
    currentDisease: [{
        type: Schema.Types.ObjectId, ref: 'Disease'
    }], //array of disease Ids.
    nurseComments: { type: String},   //(ONLY TO SHOW DOCTOR WILL NOT GO IN SUMMARY)
    //nurse examination page
    refferedTo: { type: Schema.Types.ObjectId, ref: 'User' },

    //Dr--> Physical examinaltion page
    phyExam: [{}],        //[{ name: 'Lungs', Findings:'']

    //Treatment page
    course: { type: String},
    diagonosis: { type: String},
  //  internalRefferal: { type: Array,enum:['XRAY','BLOODTEST','NONE'],default:'NONE'},
   internalRefferal: [{
         type: { type: String, enum: ['XRAY', 'BLOODTEST', 'URINETEST', 'NONE'], default: 'NONE' }, 
         comment: { type: String},
      },
    ], 
    internalReferralComments: { type: String},

    //result page
    treatmentResultType: { type: String, enum: ['Continue at EMC', 'Release', 'External Referral', 'Other'], default: 'Other' }, 
    externalRefferedTo: { type: String},
    refferedBy: { type: String, enum: ['Self', 'ICAmulance', 'RegularAmbulace'], default: 'Self' }, 
    doctorResultCommentOrOrder: { type: String},   //TODO: yet to finalize on it if continue EMC


    //final results page
    drfollowup: { type: String},
    treatmentResultComment: { type: String},
    goToERIf: { type: String},

    //last comments
    visitComment: [
          {
            submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            comment: { type: String},
            createdAt: { type: Date},
         }
    ],  
    visitSurveyId:{ type: Schema.Types.ObjectId, ref: 'VisitSurvey' },
    visitIsClosed:  { type: Number, default: 0 },
    currentStatus: { type: String},
    isPaymentDone: { type: Number, default: 0 },
    drugTakes: { type: String},
    visitDocument:[
        {
            submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            name: { type: String},
            size: { type: String},
            description:  { type: String},
            createdAt: { type: Date},
            ext: { type: String},
        }
    ]
}, {
    timestamps: true
});

var VisitInfo = mongoose.model('VisitInfo', VisitInfoSchema);
module.exports = VisitInfo;
 
