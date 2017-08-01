"use strict"

angular.module("Patients")

.factory('PatientService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {
    
    var getActivePatientList = function () {
        return $resource('/api/getActivePatientList', null, {
            get: {
                method: 'POST'
            }
        });
    }

    var getPatientList = function () {
        return $resource('/api/getAllPatient', null, {
            get: {
                method: 'GET'
            }
        });
    }
    
    var getPatientById = function (id) {
        return $resource('/api/getPatientById/' + id, null, {

            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

      var getVisitById = function (id) {
        return $resource('/api/getVisitById/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

    var addVisitReason = function() {
        return $resource('/api/addVisitReason', null, {
            save: {
                method: 'POST'
            }
        });
    }

     var addNewVisitReason = function() {
        return $resource('/api/addNewVisitReason', null, {
            save: {
                method: 'POST'
            }
        });
    }

     var addVisitDetails = function() {
        return $resource('/api/addVisitDetails', null, {
            save: {
                method: 'POST'
            }
        });
    }

      var getFamilyDoctor = function () {
        return $resource('/api/getFamilyDoctor', null, {
            get: {
                method: 'GET'
            }
        });
    }

var getKCforpatientId = function() {
        return $resource('/api/getKCforpatientId', null, {
            get: {
                method: 'GET'
            }
        });
    } 

    var addTriageDetails = function() {
        return $resource('/api/addTriage', null, {
            save: {
                method: 'POST'
            }
        });
    }

      var getTriageTestByVisitId = function (id) {
        return $resource('/api/getTriageTestByVisitId/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

     var addPatient = function() {
        return $resource('/api/addPatient', null, {
            save: {
                method: 'POST'
            }
        });
    }

 var getPatientVisitTest = function (id) {
        return $resource('/api/getPatientVisitTest/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

    var addNurseExamination = function() {
        return $resource('/api/addNurseExamination', null, {
            save: {
                method: 'POST'
            }
        });
    }
    
    //doctor exam section
    var addDoctorExamination = function() {
        return $resource('/api/addDoctorExamination', null, {
            save: {
                method: 'POST'
            }
        });
    }

    //doctor prescription section
     var addDoctorPrescription = function() {
        return $resource('/api/addDoctorPrescription', null, {
            save: {
                method: 'POST'
            }
        });
    }

    var getPrescriptions = function (id) {
        return $resource('/api/getPrescriptions/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    }

   //Payment section
    var issueInvoice = function() {
        return $resource('/api/issueInvoice', null, {
            save: {
                method: 'POST'
            }
        });
    }

     var emailInvoice = function() {
        return $resource('/api/emailInvoice', null, {
            save: {
                method: 'POST'
            }
        });
    }

   //Doctor Treatment section
    var addTreatmentDetails = function() {
        return $resource('/api/addTreatmentDetails', null, {
            save: {
                method: 'POST'
            }
        });
    }

     var addTreatmentResultDetails = function() {
        return $resource('/api/addTreatmentResultDetails', null, {
            save: {
                method: 'POST'
            }
        });
    }

    // var addFollowUpDetails = function() {
    //     return $resource('/api/addFollowUpDetails', null, {
    //         save: {
    //             method: 'POST'
    //         }
    //     });
    // }

    var issueInternalReferral = function() {
        return $resource('/api/issueInternalReferral', null, {
            save: {
                method: 'POST'
            }
        });
    }

    var getDoctorList = function () {
        return $resource('/api/getDoctorList', null, {
            get: {
                method: 'GET',
            }
        });
    }
    
    var getPatientDashboardCount = function () {
            return $resource('/api/patientDashboardCount', null, {
                get: {
                    method: 'GET'
                }
            });
    };

    var updateStatus = function() {
        return $resource('/api/updateStatus', null, {
            save: {
                method: 'POST'
            }
        });
    };

    var getStageInfoById = function (id) {
        return $resource('/api/getStageInfoById/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

    var issueDocument = function() {
        return $resource('/api/issueDocument', null, {
            save: {
                method: 'POST'
            }
        });
    }

    //closure section
     var closeVisitAndSendSurvey = function() {
        return $resource('/api/closeVisitAndSendSurvey', null, {
            save: {
                method: 'POST'
            }
        });
    }

    var getVisitDocumentInfoById = function (id) {
        return $resource('/api/getVisitDocumentInfoById/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

    var getPatientVisitHistory = function() {
        return $resource('/api/getPatientVisitHistory', null, {
            get: {
                method: 'POST'
            }
        });
    }

     var getVisitHistory = function () {
            return $resource('/api/getVisitHistory', null, {
                get: {
                    method: 'POST'
                }
            });
    };
    var getPatientEmcPrescription = function(id){
        return $resource('/api/getPatientEmcPrescription/'+ id,null,{
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    };

    var addPatientDrugs = function() {
        return $resource('/api/addPatientDrugs', null, {
            save: {
                method: 'POST'
            }
        });
    }

    var sendSummaryToFamilyDoctor = function() {
        return $resource('/api/sendSummaryToFamilyDoctor', null, {
            save: {
                method: 'POST'
            }
        });
    }
    
    var addVisitComment = function() {
        return $resource('/api/addVisitComment', null, {
            save: {
                method: 'POST'
            }
        });
    }

    
    var savePaymentDetails = function() {
        return $resource('/api/addPaymentDetails', null, {
            save: {
                method: 'POST'
            }
        });
    };

     var getPaymentDetailsByVisitId = function (id) {
        return $resource('/api/getPaymentDetailsByVisitId/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    };

    var checkVisitPaymentDone = function() {
        return $resource('/api/checkVisitPaymentDone', null, {
            save: {
                method: 'POST'
            }
        });
    };

     var getPatientDebt = function () {
            return $resource('/api/getPatientDebt', null, {
                get: {
                    method: 'POST'
                }
            });
    };

    var disableAlert = function() {
        return $resource('/api/disableAlert', null, {
            save: {
                method: 'POST'
            }
        });
    };

    var getkupatCholim = function() {
        return $resource('/api/getkupatCholim', null, {
            get: {
                method: 'GET'
            }
        });
    } 

     var visitbyId = function (id) {
        return $resource('/api/visitbyId/' + id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

    var decrementPatientWaitCount = function() {
        return $resource('/api/decrementPatientWaitCount', null, {
            save: {
                method: 'POST'
            }
        });
    };

    var getAllergies = function () {
        return $resource('/api/getAllergies', null, {
            get: {
                method: 'GET',
            }
        });
    };

     var getCities = function () {
        return $resource('/api/getCities', null, {
            get: {
                method: 'GET',
            }
        });
    };

    var getdashboardCount = function () {
            return $resource('/api/getPatientDashboardCount', null, {
                get: {
                    method: 'POST'
                }
        });
    };
     var addDoctorOrder = function() {
        return $resource('/api/addDoctorOrder', null, {
            save: {
                method: 'POST'
            }
        });
    }
 
 var addDoctorTreatment = function() {
        return $resource('/api/addDoctorTreatment', null, {
            save: {
                method: 'POST'
            }
        });
    }

     var getActivePatientListByDr = function () {
        return $resource('/api/getActivePatientListByDr', null, {
            get: {
                method: 'POST'
            }
        });
    }

    return {
      getActivePatientList: getActivePatientList,
      getPatientList: getPatientList,
      getPatientById: getPatientById,
      addVisitReason: addVisitReason,
      getVisitById: getVisitById,
      getFamilyDoctor: getFamilyDoctor,
      addNewVisitReason: addNewVisitReason,
      addVisitDetails:addVisitDetails,
      addTriageDetails: addTriageDetails,
      getTriageTestByVisitId: getTriageTestByVisitId,
      addPatient: addPatient,
      visitbyId:visitbyId,
      getPatientVisitTest: getPatientVisitTest,
      addNurseExamination: addNurseExamination,
      addDoctorExamination: addDoctorExamination,
      addDoctorPrescription:addDoctorPrescription,
      getPrescriptions: getPrescriptions,
      issueInvoice: issueInvoice,
      emailInvoice: emailInvoice,
      //doctor treatment section
      addDoctorOrder:addDoctorOrder,
      addDoctorTreatment:addDoctorTreatment,
      addTreatmentDetails : addTreatmentDetails,
      addTreatmentResultDetails : addTreatmentResultDetails,
    //   addFollowUpDetails : addFollowUpDetails,
      issueInternalReferral : issueInternalReferral,
      getDoctorList: getDoctorList,
      getPatientDashboardCount: getPatientDashboardCount,
      getKCforpatientId:getKCforpatientId,

       //status
      updateStatus: updateStatus,
      getStageInfoById: getStageInfoById,
      //docuemnt
      issueDocument: issueDocument,
      getVisitDocumentInfoById: getVisitDocumentInfoById,
      //closure section
      closeVisitAndSendSurvey: closeVisitAndSendSurvey,
      //History
      getPatientVisitHistory: getPatientVisitHistory,
      getVisitHistory: getVisitHistory,
      getPatientEmcPrescription: getPatientEmcPrescription,
      addPatientDrugs: addPatientDrugs,
      sendSummaryToFamilyDoctor: sendSummaryToFamilyDoctor,
      addVisitComment: addVisitComment,
       //Payment
      savePaymentDetails: savePaymentDetails,
      getPaymentDetailsByVisitId: getPaymentDetailsByVisitId,
      checkVisitPaymentDone: checkVisitPaymentDone,
      getPatientDebt: getPatientDebt,
      disableAlert: disableAlert,
      getkupatCholim: getkupatCholim,
      decrementPatientWaitCount: decrementPatientWaitCount,
      getAllergies: getAllergies,
      getCities: getCities,
      getdashboardCount: getdashboardCount,
      getActivePatientListByDr: getActivePatientListByDr
    }

}]);
