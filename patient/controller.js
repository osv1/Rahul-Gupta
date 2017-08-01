"use strict";


angular.module("Patients")


MCSIApp.controller('patientController', ['$scope', '$rootScope', '$location', '$ocLazyLoad', '$localStorage', '$filter', '$modal', '$http', '$window', 'ngTableParams', 'ngTableParamsService', '$state', 'logger', 'CommonService', 'PatientService', 'Upload', 'DiseaseService', 'socket', 'InventoryService', 'hotkeys', 'datepickerPopupConfig',
    function ($scope, $rootScope, $location, $ocLazyLoad, $localStorage, $filter, $modal, $http, $window, ngTableParams, ngTableParamsService, $state, logger, CommonService, PatientService, Upload, DiseaseService, socket, InventoryService, hotkeys, datepickerPopupConfig) {
        $scope.currentDate = new Date();
        $scope.visitReason = {};
        $scope.newvisitReason = {};
        $scope.visitReason.isUrgent = 0;
        $scope.newvisitReason.isUrgent = 0;
        $scope.visitCommentList = [];
        var getData = ngTableParamsService.get();
        $scope.searchTextField = getData.searchText;
        datepickerPopupConfig.showButtonBar = false;


        //--------------------------------HOTKEYS SECTION ----------------------------------
        $scope.currentPage = "";


        //hotkey: Go to active patient visit listing
        hotkeys.bindTo($scope).add({
            combo: ['shift+alt'],
            callback: function (event, hotkey) {
                $state.go('activePatient');
            }
        });

        //hotkey: Go to Next page
        hotkeys.bindTo($scope).add({
            combo: ['ctrl'],
            callback: function (event, hotkey) {
                //alert($scope.currentPage);
                //Nurse Examination Section
                if ($scope.currentPage == 'visitDetails-edit') {
                    $scope.addVisitDetails($scope.visitData, false);
                }
                else if ($scope.currentPage == 'nurseExam-edit') {
                    $scope.addNurseExamination(true);
                }

                //Reception Section
                else if ($scope.currentPage == 'patientIdentification-edit') {
                    $scope.editPatient($scope.patient, false)
                }
                else if ($scope.currentPage == 'visitReason-edit') {
                    $scope.addVisitReason($scope.visitData, false)
                }
                else if ($scope.currentPage == 'payment-edit') {
                    if ($scope.visitData && $scope.visitData._id) {
                        $location.path('/visitCard/' + $scope.visitData._id);
                    }
                }
                //New Visit start
                else if ($scope.currentPage == 'addPatient') {
                    $scope.addPatient($scope.patientData, true)
                }
                else if ($scope.currentPage == 'newVisitReason') {
                    $scope.addnewVisitReason($scope.patientData);
                }
                //doctor section
                else if ($scope.currentPage == 'doctorSummary') {
                    $location.path('/doctorExam-edit/' + $scope.visitData._id);
                }
                else if ($scope.currentPage == 'editDoctorExam') {
                    $scope.addDoctorExamDetails(false);
                }
                else if ($scope.currentPage == 'doctorOrder') {
                    $scope.addDoctorOrder(false);
                }
                else if ($scope.currentPage == 'doctorTreatment') {
                    $scope.addDoctorTreatment(false);
                }
                else if ($scope.currentPage == 'doctorPrescription') {
                    $scope.addPrescription(false);
                }
                else if ($scope.currentPage == 'doctorResult') {
                    $scope.addTreatmentResultDetails($scope.visitData, false);
                }
                //Closure Section
                else if ($scope.currentPage == 'addPatientDrugs') {
                    $scope.addPatientDrugs(false);
                }
            }
        });

        hotkeys.bindTo($scope).add({
            combo: ['esc'],
            callback: function (event, hotkey) {
                // alert($scope.currentPage);
                //Nurse Examination Section

                if ($scope.currentPage == 'visitDetails-edit') {
                    $scope.addVisitDetails($scope.visitData, true);
                }
                else if ($scope.currentPage == 'nurseExam-edit') {
                    $scope.addNurseExamination(true);
                }
                //Reception Section
                else if ($scope.currentPage == 'visitReason-edit') {
                    $scope.addVisitReason($scope.visitData, true);
                }
                else if ($scope.currentPage == 'payment-edit') {
                    if ($scope.visitData) {
                        $location.path('/visitCard/' + $scope.visitData._id);
                    }
                }
                //Closure Section
                else if ($scope.currentPage == 'addPatientDrugs') {
                    $scope.addPatientDrugs(true)
                }
                //doctor section
                else if ($scope.currentPage == 'doctorSummary') {
                    $location.path('/visitCard/' + $scope.visitData._id);
                }
                else if ($scope.currentPage == 'editDoctorExam') {
                    $scope.addDoctorExamDetails(true);
                }
                else if ($scope.currentPage == 'doctorOrder') {
                    $scope.addDoctorOrder(true);
                }
                else if ($scope.currentPage == 'doctorTreatment') {
                    $scope.addDoctorTreatment(true);
                }
                else if ($scope.currentPage == 'doctorPrescription') {
                    $scope.addPrescription(true);
                }
                else if ($scope.currentPage == 'doctorResult') {
                    $scope.addTreatmentResultDetails($scope.visitData, true);
                }

                //Reception Section
                else if ($scope.currentPage == 'patientIdentification-edit') {
                    $scope.editPatient($scope.patient, true);
                }
                else {
                    if ($scope.visitData) {
                        $location.path('/visitCard/' + $scope.visitData._id);
                    }
                }
            }
        });

        //--------------------------------ACTIVE PATIENT LISTING SECTION ----------------------------------
        $scope.searchActivePatientTextField = '';
        $scope.showActiveSearchStatus = 'NO';

        $scope.checkActiveSearchStatus = function (filter) {
            // console.log("$filter", filter);
            $scope.showActiveSearchStatus = filter;
            if (filter == 'NO') {
                $scope.searchActivePatientTextField = '';
                $scope.searchActivePatient();
            }
            if (filter == 'YES') {
                $scope.searchActivePatient();
            }
        };

        $scope.searchActivePatient = function () {
            console.log("$scope.showActiveSearchStatus", $scope.showActiveSearchStatus);
            if ($scope.showActiveSearchStatus === 'YES' || $scope.showActiveSearchStatus === 'NO' && $scope.searchActivePatientTextField == '') {
                console.log('-----searchActivePatientTextField------', $scope.searchActivePatientTextField);//Show filtered status
                ngTableParamsService.set('', '', $scope.searchActivePatientTextField, '');
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    // counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchActivePatientTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                        $scope.activeVisitList = [];
                        PatientService.getActivePatientList().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.activeVisitList = response.data;
                            console.log("$scope.activeVisitList: --->", $scope.activeVisitList);
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
        };



        $scope.getActivePatientList = function () {
            //   console.log('-----getActivePatientList------');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchActivePatientTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.activeVisitList = [];
                    PatientService.getActivePatientList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.activeVisitList = response.data;
                        console.log('$scope.activeVisitList', $scope.activeVisitList);
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };


        //---------------------------------------------------------------------------------------------------------------
        //--------------------------------ACTIVE PATIENT LISTING SECTION By DOCTOR ----------------------------------

        $scope.searchActivePatientByDrTextField = '';
        $scope.showActivePatientSearchStatus = 'NO';

        $scope.checkListSearchStatus = function (filter) {
            // console.log("$filter", filter);
            $scope.showActivePatientSearchStatus = filter;
            if (filter == 'NO') {
                $scope.searchActivePatientByDrTextField = '';
                $scope.searchActivePatient();
            }
            if (filter == 'YES') {
                $scope.searchActivePatient();
            }
        };

        $scope.searchActivePatientByDr = function () {
            console.log("$scope.showActivePatientSearchStatus", $scope.showActivePatientSearchStatus);
            if ($scope.showActivePatientSearchStatus === 'YES' || $scope.showActivePatientSearchStatus === 'NO' && $scope.searchActivePatientByDrTextField == '') {
                console.log('-----searchActivePatientTextField------', $scope.searchActivePatientByDrTextField);//Show filtered status
                ngTableParamsService.set('', '', $scope.searchActivePatientByDrTextField, '');
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    // counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchActivePatientByDrTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                        $scope.activeVisitListByDr = [];
                        PatientService.getActivePatientListByDr().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.activeVisitListByDr = response.data;
                            console.log("$scope.activeVisitListByDr: --->", $scope.activeVisitListByDr);
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
        };



        $scope.getActivePatientListByDr = function () {
            //   console.log('-----getActivePatientList------');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchActivePatientByDrTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.activeVisitListByDr = [];
                    PatientService.getActivePatientListByDr().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.activeVisitListByDr = response.data;
                        console.log('$scope.activeVisitListByDr', $scope.activeVisitListByDr);
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };
        //---------------------------------------------------------------------------------------------------------------
        $scope.isSearchEnable = false;
        //Search Patient List
        $scope.searchable = function () {
            $scope.isSearchEnable = true;
            ngTableParamsService.set('', '', $scope.searchTextField, '');
             $scope.patientList = [];
            if ($scope.searchTextField  && $scope.searchTextField != ' ') {
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    // counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                       
                        PatientService.getPatientList().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.patientList = response.data;
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
         
        };

        //Get active patient list
        $scope.getPatientList = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                //counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.patientList = [];
                    PatientService.getPatientList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        var filteredData = params.filter() ?
                            $filter('filter')(response.data, params.filter()) :
                            response.data;
                        var orderedData = params.sorting() ?
                            $filter('orderBy')(filteredData, params.orderBy()) :
                            filteredData;
                        params.total(response.totalLength);
                        $defer.resolve(orderedData);
                    });
                }
            });
        };

        $scope.Sprefix = '';
        $scope.Ssuffix = '';
        $scope.Mprefix = '';
        $scope.Msuffix = '';
        // Get patient by id
        $scope.getPatientById = function (id) {
            $scope.showTopNav = $state.params.showTopNav;
            if ($scope.showTopNav == 1) {
                $scope.currentPage = 'addPatient';
            }
            PatientService.getPatientById($state.params.id).get(function (response) {
                if (response.code == 200) {
                    console.log('$scope.patientData.mobileNo', $scope.patientData);
                    $scope.patientData = response.data;
                    var arr2 = $scope.patientData.secondaryNo.split('-');
                    if (arr2.length == 2) {
                        $scope.Sprefix = arr2[0];
                        $scope.Ssuffix = arr2[1];

                    } else if (arr2.length == 1) {
                        $scope.Ssuffix = arr2[0];
                        $scope.Sprefix = '';
                    }
                    var arr = $scope.patientData.mobileNo.split('-');
                    if (arr.length == 2) {
                        $scope.Mprefix = arr[0];
                        $scope.Msuffix = arr[1];
                    } else if (arr.length == 1) {
                        $scope.Msuffix = arr[0];
                        $scope.Mprefix = '';
                    }
                    if (response.data && response.data.allergies) {
                        $scope.allergies = response.data.allergies.join(' , ');
                    }
                } else {
                    $scope.patientData = {};
                    $scope.patientData.city = [];
                    logger.logError(response.message);
                }
            });
        };
        //--------------VISIT REASON SECTION--------------------

        //Add visit reason
        $scope.addVisitReason = function (visitReason, isExitDashboard, stateToGo) {
            if ($scope.visitReasonForm.$dirty) {
                visitReason.patientId = $scope.visitData.patientId._id;
                visitReason.visitId = $scope.visitData._id;
                PatientService.addVisitReason().save(visitReason, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else {
                            $state.go('editPayment', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
                else if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else {
                    $state.go('editPayment', { id: $scope.visitData._id });
                }
            }
        };


        $scope.addnewVisitReason = function (newvisitReason) {
            newvisitReason.patientId = $scope.patientData._id;
            PatientService.addNewVisitReason().save(newvisitReason, function (response) {
                if (response.code == 200) {
                    $scope.visitData = response.data;
                    $state.go('editPayment', { id: $scope.visitData._id });
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.showVisitCard = function (id) {
            if ($rootScope.permissionsArray.indexOf('visitCard') != -1) {
                $state.go('visitCard', { id: id });
            }
        };


        $scope.showFreshVisitCard = function (patient) {
            if (patient.status == 1) {
                logger.log('Previous Visit not finished yet');
            }
            else {
                $state.go('addPatient', { id: patient._id, showTopNav: 1 });
            }
        };

        //--------------VISIT TRIAGE SECTION--------------------

        $scope.triageTestList = [];
        $scope.newTriageTestList = [];

        //Add blank triage test group
        $scope.addtriagetest = function ($event) {
            var test = {
                pulse: 0, saturation: 0, weight: 0, bloodPressure: { minValue: 0, maxValue: 0 },
                temperature: 0, breadthPerMinute: 0, open: true
            };
            $scope.triageTestList.push(test);
            $scope.newTriageTestList.push(test);
            $event.preventDefault();
        };

        //Add triage details
        $scope.addTriageTestform = function () {
            var triageDetails = {};
            triageDetails.triageTest = [];
            triageDetails.triageTest = $scope.newTriageTestList;
            triageDetails.visitId = $scope.visitData._id;
            $scope.tagsString = $scope.visitData.patientId.allergies.map(function (tag) { return tag.text; });
            triageDetails.allergies = $scope.tagsString;
            PatientService.addTriageDetails().save(triageDetails, function (response) {
                if (response.code == 200) {
                    $scope.getVisitById();
                    // console.log("Output Data", response.data);
                    // console.log("Output Data output", response.data.alertInfo);
                    // console.log("Output Data triages", response.data.triages);
                    if (response.data && response.data.alertInfo && response.data.alertInfo.triages && response.data.alertInfo.triages.length > 0) {
                        socket.emit('triageAlert', response.data.alertInfo);
                    }
                    $scope.getTriageTestByVisitId($scope.visitData._id);
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Get triage data by id
        $scope.getTriageTestByVisitId = function (id) {
            PatientService.getTriageTestByVisitId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    if (response.data && response.data.triageTest) {
                        $scope.triageData = response.data;
                        $scope.triageTestList = response.data.triageTest;
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.allergiesInfo = [];
        $scope.getAllergies = function () {
            PatientService.getAllergies().get(function (response) {
                if (response.code == 200) {
                    $scope.allergiesInfo = response.data;
                    //console.log("Allergies---->", $scope.allergiesInfo);
                    $scope.allergiesInfo.forEach(function (e) {
                        e.text = e.name;
                    });
                    //console.log("$scope.allergiesInfo:--->", $scope.allergiesInfo);    
                } else {

                }
            });
        };

        $scope.loadAllergies = function () {
            return $scope.allergiesInfo;
        }

        $scope.cities = [];

        $scope.loadCities = function () {
            return $scope.cities;
        }

        $scope.getCities = function () {
            PatientService.getCities().get(function (response) {
                if (response.code == 200) {
                    $scope.cities = response.data;
                    //console.log("getCities---->", $scope.cities);
                    // $scope.cities.forEach(function(e) { 
                    //     e.text = e.name;
                    // });
                    //console.log("$scope.getCities:--->", $scope.cities);    
                } else {

                }
            });
        };

        $scope.changeCity = function (city) {
            if ($scope.patientData) {
                $scope.patientData.city = city;
            }
            if ($scope.patient) {
                $scope.patient.city = city;
            }
        }


        $scope.forceOneTag = function (tags) {
            return (tags.length === 0);
        }

        //--------------VISIT DETAILS SECTION--------------------
        $scope.savedExtRef = false;
        //Get visit data by Id
        $scope.getVisitById = function (id) {
            var diseaseName = [];
            console.log("getVisitById", $state.params.id);
            $scope.$emit('start', true);
            PatientService.getVisitById($state.params.id).get(function (response) {
                if (response.code == 200) {
                    console.log("getVisitById Response Data: ", response.data);
                    $scope.patientData = response.patientData;
                    $scope.visitData = response.data;
                    if (response.data.patientId) {
                        $scope.allergies = response.data.patientId.allergies.join(' , ');
                    }
                    for (var i = 0; i < response.data.currentDisease.length; i++) {
                        diseaseName.push(response.data.currentDisease[i].name);
                    }
                    $scope.diseaseName = diseaseName.join();
                    $scope.patient = $scope.visitData.patientId;
                    var extreferral = $scope.visitData.treatmentResultType;
                    if (extreferral == 'External Referral') {
                        $scope.extreferral = true;
                        $scope.savedExtRef = true;
                        $scope.RefferedTo = 'ER';

                    }
                    if (response.data.isUrgent == true) {
                        $scope.isUrgent = true;
                    } else {
                        $scope.isUrgent = false;
                    }
                    $scope.visitCommentList = $scope.visitData.visitComment;
                } else {
                    logger.logError(response.message);
                }
                $scope.$emit('stop', true);
            }),
                function (response) {
                    alert('error');
                }
        };


        $scope.toggle = function (data) {
            $scope.isUrgent = data ? true : false;
        }
        $scope.check = function (data) {
            $scope.isChecked = data ? true : false;
        }

        $scope.addVisitDetails = function (visitDetails, isExitDashboard) {
          //  if ($scope.visitDetailsForm.$dirty) {
                //visit details
                visitDetails.currentDisease = [];
                if (visitDetails.modifiedCurrentDisease) {
                    for (var i = 0; i < visitDetails.modifiedCurrentDisease.length; i++) {
                        visitDetails.currentDisease.push(visitDetails.modifiedCurrentDisease[i]._id);
                    }
                }
                //triage details
                var triageDetails = {};
                triageDetails.triageTest = [];
                triageDetails.triageTest = $scope.newTriageTestList;
                triageDetails.visitId = $scope.visitData._id;
                $scope.tagsString = $scope.visitData.patientId.allergies.map(function (tag) { return tag.text; });
                triageDetails.allergies = $scope.tagsString;

                PatientService.addVisitDetails().save(visitDetails, function (response) {
                    if (response.code == 200) {
                        console.log("addVisitDetails data:", response.data);
                        if (response.data && response.data.diseases && response.data.diseases.length > 0) {
                            socket.emit('diseaseAlert', response.data);
                        }
                        PatientService.addTriageDetails().save(triageDetails, function (response) {
                            if (response.code == 200) {

                                console.log("Output Data", response.data);
                                console.log("Output Data output", response.data.alertInfo);
                                console.log("Output Data triages", response.data.triages);
                                if (response.data && response.data.alertInfo && response.data.alertInfo.triages && response.data.alertInfo.triages.length > 0) {
                                    socket.emit('triageAlert', response.data.alertInfo);
                                }
                                $scope.getVisitById();
                                $scope.getTriageTestByVisitId($scope.visitData._id);
                                if (isExitDashboard) {
                                    $state.go('visitCard', { id: $scope.visitData._id });
                                }
                                else {
                                    $state.go('editNurseExam', { id: $scope.visitData._id });
                                }
                                logger.logSuccess(response.message);
                            } else {
                                logger.logError(response.message);
                            }
                        });

                    } else {
                        logger.logError(response.message);
                    }
                });
           // }
            // else {
            //     if (isExitDashboard) {
            //         $state.go('visitCard', { id: $scope.visitData._id });
            //     }
            //     else {
            //         $state.go('editNurseExam', { id: $scope.visitData._id });
            //     }
            // }
        };


        //Add triage details
        // $scope.addTriageTestform = function () {
        //     var triageDetails = {};
        //     triageDetails.triageTest = [];
        //     triageDetails.triageTest = $scope.newTriageTestList;
        //     triageDetails.visitId = $scope.visitData._id;
        //     $scope.tagsString = $scope.visitData.patientId.allergies.map(function (tag) { return tag.text; });
        //     triageDetails.allergies = $scope.tagsString;
        //     PatientService.addTriageDetails().save(triageDetails, function (response) {
        //         if (response.code == 200) {
        //             $scope.getVisitById();
        //             console.log("Output Data", response.data);
        //             console.log("Output Data output", response.data.alertInfo);
        //             console.log("Output Data triages", response.data.triages);
        //             if (response.data && response.data.alertInfo && response.data.alertInfo.triages && response.data.alertInfo.triages.length > 0) {
        //                 socket.emit('triageAlert', response.data.alertInfo);
        //             }
        //             $scope.getTriageTestByVisitId($scope.visitData._id);
        //             logger.logSuccess(response.message);
        //         } else {
        //             logger.logError(response.message);
        //         }
        //     });
        // };

        //  $scope.exitaddVisitDetails = function (visitData) {
        //    //  if ($scope.visitDetailsForm.$dirty) {
        //          bootbox.confirm({
        //              title: "",
        //              message: "You are going to exit the visit process and redirect to the patient''s dashboard. Do you want to save current info?",
        //              buttons: {
        //                  cancel: {
        //                      label: '<i class="fa fa-times"></i> Do Not Save'
        //                  },
        //                  confirm: {
        //                      label: '<i class="fa fa-check"></i> Save'
        //                  }
        //              },
        //              callback: function (result) {
        //                  if (result) {
        //                      $scope.addVisitDetails(visitData, true);
        //                  }
        //                  else {
        //                      $state.go('visitCard', { id: $scope.visitData._id });
        //                  }
        //              }
        //          });
        //     //  }
        //     //  else {
        //     //      //alert('form not edited');
        //     //      $state.go('visitCard', { id: $scope.visitData._id });
        //     //  }
        //  };

        //Get visit details data by Id
        $scope.getVisitDetailsById = function (id) {
            DiseaseService.getalldisease().get(function (response) {
                if (response.code == 200) {
                    $scope.diseaselist = response.data;
                    $scope.modifiedList = [];
                    //console.log("diseaslist", $scope.diseaselist);
                    for (var i = 0; i < $scope.diseaselist.length; i++) {
                        var obj = {
                            _id: $scope.diseaselist[i]._id,
                            name: $scope.diseaselist[i].name,
                            ticked: false
                        };
                        $scope.modifiedList.push(obj);
                    }
                    PatientService.getVisitById($state.params.id).get(function (response) {
                        if (response.code == 200 && response.data.currentDisease) {
                            for (var i = 0; i < response.data.currentDisease.length; i++) {
                                for (var j = 0; j < $scope.modifiedList.length; j++) {
                                    if (response.data.currentDisease[i]._id == $scope.modifiedList[j]._id) {
                                        $scope.modifiedList[j].ticked = true;
                                        break;
                                    }
                                }
                            }
                            $scope.visitData.modifiedCurrentDisease = [];
                            $scope.visitData = response.data;
                            $scope.allergies = response.data.allergies.join(' , ');
                            if (response.data.isUrgent == true) {
                                $scope.isUrgent = true;
                            } else {
                                $scope.isUrgent = false;
                            }
                        } else {
                            logger.logError(response.message);
                        }
                    });
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //--------------IDENTIFY PATIENT SECTION--------------------

        //Get family doctor list
        $scope.getFamilyDoctor = function () {
            PatientService.getFamilyDoctor().get(function (response) {
                if (response.code == 200) {
                    $scope.familydoctor = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Add Patient
        $scope.addPatient = function (patient, isNextStage) {
            if ($scope.form.$dirty) {
                patient.mobileNo = $scope.Mprefix + '-' + $scope.Msuffix;
                patient.secondaryNo = $scope.Sprefix + '-' + $scope.Ssuffix;
                console.log("pateint adding-----", patient);
                console.log("patient.cit:--->", patient.city);
                console.log(" final patient.city:--->", patient.city);
                if (!patient.patientId || patient.patientId == '') {
                    bootbox.confirm('PatientId is not filled. Do you want to autogenerate?',
                        function (result) {
                            if (result) {
                                PatientService.addPatient().save(patient, function (response) {
                                    if (response.code == 200) {
                                        logger.logSuccess(response.message);
                                        if (isNextStage) {
                                            $state.go('addNewVisitReason', { id: $scope.patientData._id });
                                        }
                                        else
                                            $state.go('patientList');
                                    } else {
                                        logger.logError(response.message);
                                    }
                                });
                            }
                        }
                    );
                }
                else {
                    PatientService.addPatient().save(patient, function (response) {
                        if (response.code == 200) {
                            logger.logSuccess(response.message);
                            if (isNextStage) {
                                $state.go('addNewVisitReason', { id: $scope.patientData._id });
                            }
                            else
                                $state.go('patientList');
                        } else {
                            logger.logError(response.message);
                        }
                    });
                }
            }
            else {
                if (isNextStage) {
                    $state.go('addNewVisitReason', { id: $scope.patientData._id });
                }
            }
        };

        $scope.getKCforpatientId = function () {
            PatientService.getKCforpatientId().get(function (response) {
                if (response.code == 200) {
                    $scope.kupatCholimlist = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //--------------IDENTIFY NURSE EXAMINATION SECTION--------------------

        $scope.nurseTest = [];
        $scope.doctorTest = [];

        //Get nurse test for current diseases
        $scope.getNurseTestByCurrentDisease = function (id) {
            PatientService.getPatientVisitTest($state.params.id).get(function (response) {
                //   console.log('getPatientVisitTest', response.data);
                if (response.code == 200) {
                    $scope.nurseTest = [];
                    $scope.doctorTest = [];
                    if (response.data) {
                        if (response.data.nurseTest) {
                            $scope.nurseTest = response.data.nurseTest;
                            for (var i = 0; i < $scope.nurseTest.length; i++) {
                                if ($scope.nurseTest[i].comment == '') {
                                    $scope.nurseTest[i].isChecked = false;
                                }
                                else {
                                    $scope.nurseTest[i].isChecked = true;
                                }
                            }
                        }
                        if (response.data.doctorTest) {
                            $scope.doctorTest = response.data.doctorTest;
                            for (var i = 0; i < $scope.doctorTest.length; i++) {
                                if ($scope.doctorTest[i].comment == '') {
                                    $scope.doctorTest[i].isChecked = false;
                                }
                                else {
                                    $scope.doctorTest[i].isChecked = true;
                                }
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Add nurse examination
        $scope.addNurseExamination = function (isExitToDashboard, stateToGo) {
            var isAlltestperformed = true;
            for (var i = 0; i < $scope.nurseTest.length; i++) {
                if ($scope.nurseTest[i].hasOwnProperty('isChecked')) {
                    if ($scope.nurseTest[i].isChecked !== true) {
                        isAlltestperformed = false;
                        break;
                    }
                }
                else {
                    isAlltestperformed = false;
                    break;
                }
            }
            if (isAlltestperformed) {
                var nurseTestDetails = {};
                nurseTestDetails.visitId = $scope.visitData._id;
                nurseTestDetails.nurseTest = $scope.nurseTest;
                nurseTestDetails.refferedTo = $scope.visitData.refferedTo;
                PatientService.addNurseExamination().save(nurseTestDetails, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                logger.logWarning('Can not continue unless all tests are confirmed!');
                if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else if (isExitToDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
            }
        };

        //Get doctor operating 
        $scope.getDoctorList = function () {
            PatientService.getDoctorList().get(function (response) {
                if (response.code == 200) {
                    //  console.log('response doctor list', response.data);
                    $scope.drlist = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };
        //--------------DOCTOR EXAMINATION SECTION--------------------
        //TODO: Put in table
        $scope.tabs = [{
            slug: 'basic',
            name: "Basic",
            checked: 3,
            finding: ''
        }, {
            slug: 'head',
            name: "Head",
            checked: 3,
            finding: ''
        }, {
            slug: 'eent',
            name: "EENT",
            checked: 3,
            finding: ''
        },
        {
            slug: 'heart',
            name: "Heart",
            checked: 3,
            finding: ''
        },
        {
            slug: 'lungs',
            name: "Lungs",
            checked: 3,
            finding: ''
        },
        {
            slug: 'skin',
            name: "Skin",
            checked: 3,
            finding: ''
        }
        ];

        //Get Doctor examination by visit id
        $scope.getVisitDoctorExamById = function (id) {
            PatientService.getVisitById($state.params.id).get(function (response) {
                console.log("----getVisitDoctorExamById---", response.data);
                if (response.data.patientId) {
                    $scope.allergies = response.data.patientId.allergies.join(' , ');
                }
                if (response.code == 200) {
                    for (var i = 0; i < response.data.phyExam.length; i++) {
                        for (var j = 0; j < $scope.tabs.length; j++) {
                            $scope.tabs[j].checked = response.data.phyExam[j].value;
                            $scope.tabs[j].finding = response.data.phyExam[j].finding;
                            // if (response.data.phyExam[i].value == $scope.tabs[j].checked) {
                            //     $scope.tabs[j].checked = true;
                            //     $scope.tabs[j].finding = response.data.phyExam[i].finding;
                            //     break;
                            // }
                        }
                    }
                    console.log('$scope.tabs', $scope.tabs);
                    $scope.visitData = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Add doctor examination details
        $scope.addDoctorExamDetails = function (isExitDashboard, stateToGo) {
            var isAlltestperformed = true;
            for (var i = 0; i < $scope.doctorTest.length; i++) {
                if ($scope.doctorTest[i].isChecked !== true) {
                    isAlltestperformed = false;
                    break;
                }
            }
            if (isAlltestperformed) {
                var doctorExamDetails = {};
                doctorExamDetails.visitId = $scope.visitData._id;
                doctorExamDetails.currentdisease = $scope.visitData.currentdisease;
                doctorExamDetails.doctorTest = $scope.doctorTest;
                doctorExamDetails.phyExam = [];
                for (var i = 0; i < $scope.tabs.length; i++) {
                    if ($scope.tabs[i].checked === 2) {
                        doctorExamDetails.phyExam.push({
                            name: $scope.tabs[i].name,
                            finding: $scope.tabs[i].finding,
                            value: 2

                        })
                    } else {
                        doctorExamDetails.phyExam.push({
                            name: $scope.tabs[i].name,
                            finding: '',
                            value: $scope.tabs[i].checked

                        })

                    }
                }

                // doctorExamDetails.currentdisease = $scope.visitData.currentdisease;
                // doctorExamDetails.doctorTest = $scope.doctorTest;
                // doctorExamDetails.phyExam = [];
                // for (var i = 0; i < $scope.tabs.length; i++) {
                //     if ($scope.tabs[i].checked === 2) {
                //         doctorExamDetails.phyExam.push({
                //             name: $scope.tabs[i].name,
                //             finding: $scope.tabs[i].finding,
                //             value: 2
                //         });
                //     }
                // }
                // console.log('doctorExamDetails', doctorExamDetails);
                PatientService.addDoctorExamination().save(doctorExamDetails, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else {
                            $state.go('doctorOrder', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                // alert(isExitDashboard);
                logger.logWarning('Can not continue unless all tests are confirmed!');
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
            }
        };


        //--------------PRESCRIPTION SECTION--------------------
        $scope.emcOrders = [];
        $scope.extOrders = [];
        $scope.drOrders = [];

        //Get prescription for visit by visit id
        $scope.getPrescriptionById = function (id) {
            $scope.isExtOrderSaved = false;
            PatientService.getPrescriptions($state.params.id).get(function (response) {
                if (response.code == 200) {
                    if (response.data) {
                        {
                            if (response.data.emcOrder) {
                                $scope.emcOrders = response.data.emcOrder;
                            }
                            if (response.data.extOrder) {
                                $scope.extOrders = response.data.extOrder;
                                if (response.data.extOrder.length > 1) {
                                    $scope.isExtOrderSaved = true;
                                }
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.duplicatedData = [];

        //Add new row for emc order
        $scope.addNewEmcOrders = function () {
            $scope.emcOrders.push({
                'dosage': "",
                'drugName': "",
                'description': "",
                'prescriptionAmount': 0,
                'props': []
            });
            $scope.duplicatedData[$scope.emcOrders.length - 1] = angular.copy($scope.inventoryList);
        };

        //Remove selected row from emc order
        $scope.removeEmcOrders = function () {
            var newDataList = [];
            $scope.selectedAll = false;
            angular.forEach($scope.emcOrders, function (selected) {
                if (!selected.selected) {
                    newDataList.push(selected);
                }
            });
            $scope.emcOrders = newDataList;
        };

        //Select all emc orders
        $scope.checkAllEmcOrders = function () {
            if (!$scope.selectedAll) {
                $scope.selectedAll = true;
            } else {
                $scope.selectedAll = false;
            }
            angular.forEach($scope.emcOrders, function (emcOrder) {
                emcOrder.selected = $scope.selectedAll;
            });
        };

        //Add new row for ext order
        $scope.addNewExtOrders = function () {
            $scope.extOrders.push({
                'dosage': "",
                'drugName': "",
                'description': "",
                'prescriptionAmount': 0,
            });
        };

        //Remove selected row from ext order
        $scope.removeExtOrders = function () {
            var newDataList = [];
            $scope.selectedAll = false;
            angular.forEach($scope.extOrders, function (selected) {
                if (!selected.selected) {
                    newDataList.push(selected);
                }
            });
            $scope.extOrders = newDataList;
        };

        //Select all ext orders
        $scope.checkAllExtOrders = function () {
            if (!$scope.selectedAll) {
                $scope.selectedAll = true;
            } else {
                $scope.selectedAll = false;
            }
            angular.forEach($scope.extOrders, function (extOrder) {
                extOrder.selected = $scope.selectedAll;
            });
        };

        //Add prescription for visit
        $scope.addPrescription = function (isExitDashboard, stateToGo) {
            if ($scope.form.$dirty) {
                var prescriptionDetails = {};
                prescriptionDetails.visitId = $scope.visitData._id;
                angular.forEach($scope.emcOrders, function (emcOrder, index) {
                     if(emcOrder.drugName === ''){
                         ($scope.emcOrders).splice(index, 1);
                     }
                });
                prescriptionDetails.emcOrder = $scope.emcOrders;
                prescriptionDetails.extOrder = $scope.extOrders;
                PatientService.addDoctorPrescription().save(prescriptionDetails, function (response) {
                    if (response.code == 200) {
                        //  console.log("$scope.extOrders.length", $scope.extOrders.length);
                        if ($scope.extOrders && $scope.extOrders.length > 0) {
                            $scope.isExtOrderSaved = true;
                        }
                        else {
                            $scope.isExtOrderSaved = false;
                        }
                        $scope.getPrescriptionById();
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else {
                            $state.go('doctorResult', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
                else if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else {
                    $state.go('doctorResult', { id: $scope.visitData._id });
                }
            }
        };

         
        $scope.saveDrPresAndIssuePres = function () {
            console.log("----------saveDrPresAndIssuePres----------");
            if ($scope.form.$dirty) {
                var prescriptionDetails = {};
                angular.forEach($scope.emcOrders, function (emcOrder, index) {
                     if(emcOrder.drugName === ''){
                         ($scope.emcOrders).splice(index, 1);
                     }
                });
                prescriptionDetails.visitId = $scope.visitData._id;
                prescriptionDetails.emcOrder = $scope.emcOrders;
                prescriptionDetails.extOrder = $scope.extOrders;
                 PatientService.addDoctorPrescription().save(prescriptionDetails, function (response) {
                    if (response.code == 200) {
                        $scope.getPrescriptionById();
                        logger.logSuccess(response.message);
                        $scope.issueDocument('Prescription');             
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
               if($scope.extOrders && $scope.extOrders.length > 0){
                   $scope.issueDocument('Prescription');   
               }
            }
        }

        $scope.addDrugNameToEmcOrderItem = function (selectedDrug, OrderIndex) {
            if (selectedDrug && selectedDrug[0]) {
                $scope.emcOrders[OrderIndex].drugName = selectedDrug[0].drugName;
            }
        }

        $scope.addDosageToEmcOrderItem = function (selectedDosage, OrderIndex) {
            if (selectedDosage) {
                $scope.emcOrders[OrderIndex].dosage = selectedDosage;
            }
        }

        $scope.getDrugs = function () {
            var drugDetails = [];
            InventoryService.getDrugs().get(function (response) {
                if (response.code == 200) {
                    $scope.inventoryList = response.data;
                    $scope.inventoryList.forEach(function (e) {
                        e.name = e.drugName;
                        e.ticked = false;
                    });
                } else {
                    alert("err in retriveing data");
                }
            });
        }


        //--------------PAYMENT SECTION--------------------

        $scope.paymentItemList = [{ name: '', price: '' }];

        //Add payment for row
        $scope.newPaymentItem = function ($event) {
            $scope.paymentItemList.push({ name: '', price: '' });
            $event.preventDefault();
        };

        $scope.issueInvLoader = false;
        $scope.emailInvLoader = false;
        //TODO: save payment data
        //Issue invoice for visit
        $scope.issueInvoice = function (paymentDetails) {
            $scope.issueInvLoader = true;
            //console.log('issueInvoice');
            paymentDetails.visitId = $scope.visitData._id;
            paymentDetails.itemList = $scope.paymentItemList;
            //console.log('payment: ', paymentDetails);
            //console.log('paymentItemList: ', $scope.paymentItemList);
            PatientService.issueInvoice().save(paymentDetails, function (response) {
                $scope.issueInvLoader = false;
                //console.log('response', response);
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $scope.invoiceIssuedData = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //email invoice generated for visit
        $scope.emailInvoice = function () {
            $scope.emailInvLoader = true;
            var invoiceDetails = {};
            invoiceDetails.visitId = $scope.visitData._id;
            invoiceDetails.invoiceIssuedData = $scope.invoiceIssuedData;
            PatientService.emailInvoice().save(invoiceDetails, function (response) {
                $scope.issueInvLoader = false;
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Go to payment screen from in debt lisiting
        $scope.showVisitPayment = function (id) {
            $state.go('editPayment', { id: id });
        };

        //--------------DOCTOR TREATMENT SECTION--------------------
        $scope.internalRefferalXray = {};
        $scope.internalRefferalBTest = {};
        $scope.internalRefUrineTest = {};
        
        $scope.getTreatmentDetails = function () {
            PatientService.getVisitById($state.params.id).get(function (response) {
                if (response.code == 200) {
                    for (var i = 0; i < response.data.internalRefferal.length; i++) {
                        if (response.data.internalRefferal[i].type == 'XRAY') {
                            $scope.internalRefferalXray.typeXray = 'XRAY';
                            $scope.xrayComment = true;
                            $scope.internalRefferalXray.comments = response.data.internalRefferal[i].comment;
                        }
                        else if (response.data.internalRefferal[i].type == 'BLOODTEST') {
                            $scope.internalRefferalBTest.typeBT = 'BLOODTEST';
                            $scope.bTComment = true;
                            $scope.internalRefferalBTest.comments = response.data.internalRefferal[i].comment;
                        }
                        else if (response.data.internalRefferal[i].type == 'URINETEST') {
                            $scope.internalRefUrineTest.typeUr = 'URINETEST';
                            $scope.UrComment = true;
                            $scope.internalRefUrineTest.comments = response.data.internalRefferal[i].comment;
                        }
                    }
                    $scope.visitData = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.saveDrOrderAndIssueInternalRef = function () {
            console.log("----------saveDrOrderAndIssueInternalRef----------");
            if ($scope.doctorTreatmentForm.$dirty) {
                var treatmentData = {};
                var internalReferalArray = [];
                if ($scope.internalRefferalXray.typeXray == 'XRAY') {
                    internalReferalArray.push({
                        type: $scope.internalRefferalXray.typeXray,
                        comment: $scope.internalRefferalXray.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                if ($scope.internalRefferalBTest.typeBT == 'BLOODTEST') {
                    internalReferalArray.push({
                        type: $scope.internalRefferalBTest.typeBT,
                        comment: $scope.internalRefferalBTest.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                if ($scope.internalRefUrineTest.typeUr == 'URINETEST') {
                    internalReferalArray.push({
                        type: $scope.internalRefUrineTest.typeUr,
                        comment: $scope.internalRefUrineTest.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                console.log("internalReferalArray---->", internalReferalArray);
              
                treatmentData.visitId = $state.params.id;
                console.log(treatmentData);
                PatientService.addDoctorOrder().save(treatmentData, function (response) {
                    if (response.code == 200) {
                        $scope.getVisitById();
                        logger.logSuccess(response.message);
                        $scope.issueDocument('Internal Referral');             
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
               if($scope.visitData.internalRefferal && $scope.visitData.internalRefferal.length > 0){
                    console.log("----------$scope.visitData.internalRefferal----------", $scope.visitData.internalRefferal);
                   $scope.issueDocument('Internal Referral');   
               }
            }
        };

        //Add doctor treatment details
        $scope.addDoctorOrder = function (isExitDashboard, stateToGo) {
            if ($scope.doctorTreatmentForm.$dirty) {
                var treatmentData = {};
                var internalReferalArray = [];
                if ($scope.internalRefferalXray.typeXray == 'XRAY') {
                    internalReferalArray.push({
                        type: $scope.internalRefferalXray.typeXray,
                        comment: $scope.internalRefferalXray.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                if ($scope.internalRefferalBTest.typeBT == 'BLOODTEST') {
                    internalReferalArray.push({
                        type: $scope.internalRefferalBTest.typeBT,
                        comment: $scope.internalRefferalBTest.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                if ($scope.internalRefUrineTest.typeUr == 'URINETEST') {
                    internalReferalArray.push({
                        type: $scope.internalRefUrineTest.typeUr,
                        comment: $scope.internalRefUrineTest.comments
                    });
                    treatmentData.internalRefferal = internalReferalArray;
                }
                console.log("internalReferalArray---->", internalReferalArray);
                treatmentData.course = $scope.visitData.course;
                treatmentData.diagonosis = $scope.visitData.diagonosis;
                treatmentData.internalReferralComments = $scope.visitData.internalReferralComments;
               // treatmentData.internalRefferal = internalReferalArray;
                treatmentData.visitId = $state.params.id;
                console.log(treatmentData);
                PatientService.addDoctorOrder().save(treatmentData, function (response) {
                    if (response.code == 200) {
                        $scope.getVisitById();
                        logger.logSuccess(response.message);
                        if (internalReferalArray.length > 0) {
                            bootbox.confirm({
                                title: "",
                                message: "Do you want to issue internal referral?",
                                buttons: {
                                    cancel: {
                                        label: '<i class="fa fa-times"></i> No'
                                    },
                                    confirm: {
                                        label: '<i class="fa fa-check"></i>Yes'
                                    }
                                },
                                callback: function (result) {
                                    if (result) {
                                        $scope.issueDocument('Internal Referral');
                                        if (isExitDashboard) {
                                            $state.go('visitCard', { id: $scope.visitData._id });
                                        }
                                        else if (stateToGo) {
                                            $state.go(stateToGo, { id: $scope.visitData._id });
                                        }
                                        else {
                                            $state.go('doctorTreatment', { id: $scope.visitData._id });
                                        }
                                    }
                                    else {
                                        if (isExitDashboard) {
                                            $state.go('visitCard', { id: $scope.visitData._id });
                                        }
                                        else if (stateToGo) {
                                            $state.go(stateToGo, { id: $scope.visitData._id });
                                        }
                                        else {
                                            $state.go('doctorTreatment', { id: $scope.visitData._id });
                                        }
                                    }
                                }
                            });
                        }
                        else {
                            if (isExitDashboard) {
                                $state.go('visitCard', { id: $scope.visitData._id });
                            }
                            else if (stateToGo) {
                                $state.go(stateToGo, { id: $scope.visitData._id });
                            }
                            else {
                                $state.go('doctorTreatment', { id: $scope.visitData._id });
                            }
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                // if(visitData.internalRefferal)
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
                else if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else {
                    $state.go('doctorTreatment', { id: $scope.visitData._id });
                }
            }
        };



        $scope.visitData = {
            externalRefferedTo: null
        };
        //Add doctor treatment result details
        $scope.addTreatmentResultDetails = function (docResult, isExitDashboard, stateToGo) {
            docResult.visitId = $state.params.id;
            $scope.savedExtRef = false;
            if ($scope.form.$dirty) {
                PatientService.addTreatmentResultDetails().save(docResult, function (response) {
                    if (response.code == 200) {
                        if (docResult.treatmentResultType == 'External Referral') {
                            $scope.savedExtRef = true;
                        }
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else if ($scope.savedExtRef) {
                            bootbox.confirm({
                                title: "",
                                message: "Do you want to issue External referral?",
                                buttons: {
                                    cancel: {
                                        label: '<i class="fa fa-times"></i> No'
                                    },
                                    confirm: {
                                        label: '<i class="fa fa-check"></i>Yes'
                                    }
                                },
                                callback: function (result) {
                                    if (result) {
                                        $scope.issueDocument('External Referral');
                                        if (stateToGo) {
                                            $state.go(stateToGo, { id: $scope.visitData._id });
                                        }
                                        else {
                                            $state.go('visitCard', { id: $scope.visitData._id });
                                        }
                                    }
                                    else {
                                        $state.go('visitCard', { id: $scope.visitData._id });
                                    }
                                }
                            });
                        }
                        else {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
                else if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
            }
        };

        // $scope.exitaddTreatmentResultDetails = function (visitData) {
        //     bootbox.confirm({
        //         title: "",
        //         message: "You are going to exit the visit process and redirect to the patient''s dashboard. Do you want to save current info?",
        //         buttons: {
        //             cancel: {
        //                 label: '<i class="fa fa-times"></i> Do Not Save'
        //             },
        //             confirm: {
        //                 label: '<i class="fa fa-check"></i> Save'
        //             }
        //         },
        //         callback: function (result) {
        //             if(result){

        //                    $scope.addTreatmentResultDetails(visitData, true);
        //             }
        //             else{
        //                 $state.go('visitCard', { id: $scope.visitData._id });
        //             }
        //         }
        //     });
        // };


        //Issue internal referal document for visit
        $scope.issueInternalReferral = function () {
            var treatmentData = {};
            treatmentData.visitId = $state.params.id;
            PatientService.issueInternalReferral().save(treatmentData, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.editPatient = function (patient, isExitDashboard, stateToGo) {
            if ($scope.form.$dirty) {
                patient.mobileNo = $scope.Mprefix + '-' + $scope.Msuffix;
                patient.secondaryNo = $scope.Sprefix + '-' + $scope.Ssuffix;
                PatientService.addPatient().save(patient, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.patient.visitId });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.patient.visitId });
                        }
                        else {
                            $state.go('editVisitReason', { id: $scope.patient.visitId });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                // $state.go('editVisitReason', { id: $scope.patient.visitId });
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.patient.visitId });
                }
                else if (stateToGo) {
                    $state.go(stateToGo, { id: $scope.patient.visitId });
                }
                else {
                    $state.go('editVisitReason', { id: $scope.patient.visitId });
                }
            }
        }
       
        //---------------ISSUE document-----------------------------------
        //Issue document
        $scope.issueDocument = function (docType, action) {
            console.log('---issueDocument---');
            if (docType == 'Prescription' && $scope.extOrders && $scope.extOrders.length == 0) {
                logger.logWarning('No External prescription to issue!');
            }

            else if (docType == 'External Referral' && $scope.savedExtRef == false) {
                logger.logWarning('Save treatment result for issuing document!');
            }
            else {
                var docData = {};
                docData.visitId = $state.params.id;
                docData.docType = docType;
                if (!action  || $scope.issuedocChecked == true) {
                  $scope.loader = true;
                }
                console.log('loader:', $scope.loader);
                PatientService.issueDocument().save(docData, function (response) {
                    $scope.loader = false;
                    if (response.code == 200) {
                        //  console.log("response.data---> issuedocuemnt", response.data);
                        if (!action  || $scope.issuedocChecked == true) {
                            for (var i = 0; i < response.data.length; i++) {
                                // console.log("response.data[i]---> issuedocuemnt", response.data[i]);
                                $http.get(baseUrl + '/getdoc/' + response.data[i]).success(function (data) {
                                    //  console.log("response pdf:--->", data);
                                    if (data == "" || data == undefined) {
                                        logger.logError("Falied to open PDF.");
                                    } else { //For IE using atob convert base64 encoded data to byte array
                                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                            var byteCharacters = atob(data);
                                            var byteNumbers = new Array(byteCharacters.length);
                                            for (var i = 0; i < byteCharacters.length; i++) {
                                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                                            }
                                            var byteArray = new Uint8Array(byteNumbers);
                                            var blob = new Blob([byteArray], {
                                                type: 'application/pdf'
                                            });
                                            window.navigator.msSaveOrOpenBlob(blob, fileName);
                                        } else { // Directly use base 64 encoded data for rest browsers (not IE)
                                            var base64EncodedPDF = data;
                                            var dataURI = "data:application/pdf;base64," + base64EncodedPDF;
                                            window.open(dataURI, '_blank');
                                            window.close(dataURI);
                                        }
                                    }
                                });
                            }
                        }
                        if (action == 1) {
                            $scope.sendSummaryToFamilyDoctor();
                        }
                        else if (action == 2) {
                            $scope.closeVisitAndSendSurvey();
                        }
                        else if (action == 3) {
                            $scope.sendSummaryToFamilyDoctor();
                            $scope.closeVisitAndSendSurvey();
                        }
                        else {
                            logger.logSuccess(response.message);
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        };

        //Get visit Document Information
        $scope.getVisitDocumentInfoById = function () {
            console.log('---getVisitDocumentInfoById---');
            PatientService.getVisitDocumentInfoById($state.params.id).get(function (response) {
                if (response.code == 200) {
                    $scope.visitDocumentData = response.data;
                    console.log('$scope.visitDocumentData:', $scope.visitDocumentData);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Upload file
        $scope.uploadFile = function (file) {

            var visitId = $scope.visitData._id;
            $scope.loader = true;
            Upload.upload({
                url: baseUrl + '/api/uploadFile',
                data: { file: file, visitId: visitId }
            }).then(function (resp) {
                $scope.loader = false;
                console.log("resp:--->", resp.data);
                if (resp.data && resp.data.code == 200) {
                    logger.logSuccess(resp.data.message);
                    $scope.getVisitDocumentInfoById();
                }
                else {
                    logger.logError(resp.data.message);
                }
            }
                // , function (resp) {
                //     logger.logError(resp.status);
                // }
                // , function (evt) {
                //     var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                );
        }

        //Download file
        $scope.download = function (document_id) {
            var id = document_id + '_' + $scope.visitData._id;
            $window.open(baseUrl + '/download-file/' + id, '_blank');
        }

        //View visit document
        $scope.viewVisitDocument = function (document_id) {
            var id = document_id + '_' + $scope.visitData._id;
            $http.get(baseUrl + '/viewVisitDocument/' + id).success(function (data) {
                if (data == "" || data == undefined) {
                    logger.logError("Falied to open PDF.");
                } else { //For IE using atob convert base64 encoded data to byte array
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        var byteCharacters = atob(data);
                        var byteNumbers = new Array(byteCharacters.length);
                        for (var i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        var byteArray = new Uint8Array(byteNumbers);
                        var blob = new Blob([byteArray], {
                            type: 'application/pdf'
                        });
                        window.navigator.msSaveOrOpenBlob(blob, fileName);
                    } else { // Directly use base 64 encoded data for rest browsers (not IE)
                        var base64EncodedPDF = data;
                        var dataURI = "data:application/pdf;base64," + base64EncodedPDF;
                        window.open(dataURI, '_blank');
                        window.close(dataURI);
                    }
                }
            });
        }
        //----------------CLOSURE SECTION---------------------------------------

        //Close Visit send survey
        $scope.closeVisitAndSendSurvey = function () {
            var details = {
                visitId: $state.params.id
            };
            if ($scope.visitData) {

                PatientService.checkVisitPaymentDone().save(details, function (response) {
                    console.log("checkVisitPaymentDone: ", response.data);
                    if (response.data == true) {
                        PatientService.closeVisitAndSendSurvey().save(details, function (response) {
                            if (response.code == 200) {
                                logger.logSuccess(response.message);
                                $state.go('visitCard', { id: $state.params.id });
                            } else {
                                logger.logError(response.message);
                            }
                        });
                    }
                    else {
                        bootbox.confirm('Are you sure you want to close visit? Patient did not pay yet.',
                            function (result) {
                                if (result) {
                                    PatientService.closeVisitAndSendSurvey().save(details, function (response) {
                                        if (response.code == 200) {
                                            logger.logSuccess(response.message);
                                            $state.go('visitCard', { id: $state.params.id });
                                        } else {
                                            logger.logError(response.message);
                                        }
                                    });
                                }
                            }
                        );
                    }
                });//checkpayment
            }
        };

         $scope.issuedocChecked = true;
         $scope.sendMailToFamilyDrChecked = true;
         $scope.closeVistChecked = true;

         $scope.submitSummary = function(visitCard){
                  var action = 0;
                  console.log("submitSummary");
                  console.log("$scope.check1--->" + $scope.issuedocChecked + "----$scope.sendMailToFamilyDrChecked---" + $scope.sendMailToFamilyDrChecked + "-----$scope.closeVistChecked------" + $scope.closeVistChecked);
                  if($scope.issuedocChecked == true && $scope.sendMailToFamilyDrChecked == false && $scope.closeVistChecked == false){
                     $scope.issueDocument('Treatment Summary');
                  }
                  else if($scope.issuedocChecked == true && $scope.sendMailToFamilyDrChecked == true && $scope.closeVistChecked == false){
                     action = 1;//sendsummarytodocotr
                     $scope.issueDocument('Treatment Summary', action );
                  }
                  else if($scope.sendMailToFamilyDrChecked == false && $scope.closeVistChecked == true){
                     action = 2;//sendsummarytodocotr
                     $scope.issueDocument('Treatment Summary', action );
                  }
                 else if($scope.issuedocChecked == false && $scope.sendMailToFamilyDrChecked == true && $scope.closeVistChecked == false){
                     action = 1;//sendsummarytodocotr
                     $scope.issueDocument('Treatment Summary', action );
                  }
                else if($scope.sendMailToFamilyDrChecked == true && $scope.closeVistChecked == true){
                     action = 3;//sendsummarytodocotr
                     $scope.issueDocument('Treatment Summary', action );
                  }
                  if($scope.issuedocChecked == false && $scope.sendMailToFamilyDrChecked == false && $scope.closeVistChecked == false){
                     $scope.issueDocument('Treatment Summary');
                    $location.path('/visitCard/' + visitCard);
                  }
                
                
               // $location.path('/visitCard/' + visitCard);
         }

        // -------PATIENT VISIT HISTORY AND ALL CLOSED VISITS--------------------
        //Get Patient Visit History List   
        $scope.searchPatientVisitTextField = '';
        $scope.searchPatientVisits = function () {
            console.log('searchPatientVisits', $scope.showFilteredStatus);
            if ($scope.showFilteredStatus === 'YES' || $scope.showFilteredStatus === 'NO' && $scope.searchPatientVisitTextField == '') { //Show filtered status
                ngTableParamsService.set('', '', $scope.searchPatientVisitTextField, '');
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    //counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchPatientVisitTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                        $scope.completedVisitList = [];
                        $scope.paramUrl.visitId = $state.params.id;
                        PatientService.getPatientVisitHistory().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.completedVisitList = response.data;
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
        };

        $scope.getPatientVisitHistory = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                //counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchPatientVisitTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.completedVisitList = [];
                    $scope.paramUrl.visitId = $state.params.id;
                    PatientService.getPatientVisitHistory().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.completedVisitList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.showFilteredStatus = 'NO';
        $scope.checkFilteredStatus = function (filter) {
            console.log('filter', filter);
            $scope.showFilteredStatus = filter;
            if (filter == 'NO') {
                $scope.searchPatientVisitTextField = '';
                $scope.searchPatientVisits();
            }
            if (filter == 'YES') {
                $scope.searchPatientVisits();
            }
        };


        $scope.searchVisitHistoryTextField = '';
        $scope.showHistoryStatus = 'NO';

        $scope.checkHistoryStatus = function (filter) {
            $scope.showHistoryStatus = filter;
            if (filter == 'NO') {
                $scope.searchVisitHistoryTextField = '';
                $scope.searchVisitHistory();
            }
            if (filter == 'YES') {
                $scope.searchVisitHistory();
            }
        };

        $scope.searchVisitHistory = function () {
            console.log("$scope.showHistoryStatus", $scope.showHistoryStatus);
            if ($scope.showHistoryStatus === 'YES' || $scope.showHistoryStatus === 'NO' && $scope.searchVisitHistoryTextField == '') { //Show filtered status
                ngTableParamsService.set('', '', $scope.searchVisitHistoryTextField, '');
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    // counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchVisitHistoryTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                        $scope.closedVisitList = [];
                        PatientService.getVisitHistory().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.closedVisitList = response.data;
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
        };

        $scope.getVisitHistory = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchVisitHistoryTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.closedVisitList = [];
                    PatientService.getVisitHistory().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.closedVisitList = response.data;
                        console.log('$scope.closedVisitList', $scope.closedVisitList);
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        //-------------- STATUS SECTION-------------------
        $scope.updateStatus = function (visitId, status, page) {
            console.log("updateStatus");
            var visitDetails = {
                visitId: visitId,
                status: status
            };
            PatientService.updateStatus().save(visitDetails, function (response) {
                if (response.code == 200) {
                    $location.path('/' + page + '/' + $scope.visitData._id);

                } else {
                    logger.logError(response.message);
                }
            });
        };

        //decrement patient wait count on patient examination start by doctor
        $scope.decrementPatientWaitCount = function (visitId) {

            console.log("----------decrementPatientWaitCount--------------");
            var visitDetails = {
                visitId: visitId
            };
            PatientService.decrementPatientWaitCount().save(visitDetails, function (response) {
                if (response.code == 200) {
                    //$location.path('/' + page + '/' + $scope.visitData._id);
                } else {
                    // logger.logError(response.message);
                }
            });
        };



        $scope.getStageInfoById = function () {
            $scope.$emit('start', true);
            PatientService.getStageInfoById($state.params.id).get(function (response) {
                // console.log("----getStageInfoById---", $state.params.id);
                if (response.code == 200) {
                    if (response.data && response.data.stages && response.data.mainStage) {
                        $scope.stageData = response.data.stages;
                        $scope.mainStages = response.data.mainStage;
                        //console.log('stageData', $scope.stageData);
                    }
                } else {
                    logger.logError(response.message);
                }
                $scope.$emit('stop', true);
            });
        };

        $scope.isStageCompleted = function (stageName) {
            var found = false;
            if ($scope.stageData) {
                var stageList = $scope.stageData;
                for (var i = 0; i < stageList.length; i++) {
                    if (stageList[i].name == stageName && stageList[i].isCompleted == 1) {
                        found = true;
                        break;
                    }
                }
                return found;
            }
        };



        $scope.getStageDateTime = function (stageName) {
            var found = 0;
            var returnTime = "";
            if ($scope.stageData) {
                var stageList = $scope.stageData;
                for (var i = 0; i < stageList.length; i++) {
                    if (stageList[i].name == stageName) {
                        found = 1;
                        returnTime = stageList[i].updatedAt;
                    }
                }
            }
            return returnTime;
        };


        $scope.getMainStageDateTime = function (stageName) {
            if ($scope.stageData) {
                var stageList = $scope.mainStages;
                for (var i = 0; i < stageList.length; i++) {
                    if (stageList[i].name == stageName) {
                        return stageList[i].updatedAt;
                    }
                }
            }
        };

        //----------------Drugs Section-----------------------
        $scope.getPatientEmcPrescription = function () {
            PatientService.getPrescriptions($state.params.id).get(function (response) {
                if (response.code == 200) {
                    if (response.data) {
                        {
                            if (response.data.emcOrder) {
                                $scope.emcOrders = response.data.emcOrder;
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.givePrescriptionOnSomeClick = function ($index) {
            $scope.emcOrders[$index].isSomeClick = true;
        }

        $scope.addPatientDrugs = function (isExitDashboard) {
            //  if ($scope.form.$dirty) {
            var prescriptionDetails = {};
            prescriptionDetails.visitId = $scope.visitData._id;
            prescriptionDetails.emcOrder = $scope.emcOrders;
            PatientService.addPatientDrugs().save(prescriptionDetails, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    if (isExitDashboard) {
                        $state.go('visitCard', { id: $scope.visitData._id });
                    }
                    else {
                        $state.go('summary', { id: $scope.visitData._id });
                    }
                } else {
                    logger.logError(response.message);
                }
            });
            // }
            // else {
            //     if (isExitDashboard) {
            //         $state.go('visitCard', { id: $scope.visitData._id });
            //     }
            //     else {
            //         $state.go('summary', { id: $scope.visitData._id });
            //     }
            // }
        }

        //----------------Drug Status-----------------------
        $scope.Yes = "";
        $scope.Yes = function (index) {
            $scope.emcOrders[index].Yes = "yes";
            $scope.emcOrders[index].Some = "";
            $scope.emcOrders[index].No = "";
        }
        $scope.Some = "";
        $scope.Some = function (index) {
            $scope.emcOrders[index].Yes = "";
            $scope.emcOrders[index].Some = "some";
            $scope.emcOrders[index].No = "";
        }
        $scope.No = "";
        $scope.No = function (index) {
            $scope.emcOrders[index].Yes = "";
            $scope.emcOrders[index].Some = "";
            $scope.emcOrders[index].No = "No";
        }

        //--------------------------------SUMMARY SECTION----------------------------------
        $scope.sendSummaryToFamilyDoctor = function () {
            $scope.sendSummaryLoader = true;
            var details = {
                visitId: $state.params.id
            };
            PatientService.sendSummaryToFamilyDoctor().save(details, function (response) {
                $scope.sendSummaryLoader = false;
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else if (response.code == 402) {
                    logger.log(response.message);
                }
            });
        };

        $scope.disableAlert = function () {
            console.log("------------------------disableAlert------------------");
            var details = {
                visitId: $state.params.id
            };
            PatientService.disableAlert().save(details, function (response) {
                if (response.code == 200) {
                    //logger.logSuccess(response.message);
                } else {
                    //logger.logError(response.message);
                }
            });
        };
        //-----------------VISIT DOCUMENT--------------------------------

        $scope.newVisitCommentList = [];

        //Add blank comment
        $scope.addBlankVisitComment = function ($event) {
            var comment = {
                comment: "",
                open: true
            };
            $scope.visitCommentList.push(comment);
            $scope.newVisitCommentList.push(comment);
            $event.preventDefault();
        };

        //Add comment to visitcomments
        $scope.addVisitComment = function (isExitDashboard) {
            if ($scope.form.$dirty) {
                var visitDetails = {};
                visitDetails.visitComment = [];
                visitDetails.visitComment = $scope.newVisitCommentList;
                visitDetails.visitId = $scope.visitData._id;
                PatientService.addVisitComment().save(visitDetails, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        $scope.newVisitCommentList = [];
                        $scope.getVisitById();
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }

                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                if (isExitDashboard) {
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
            }
        };

        //--------------PAYMENT SECTION--------------------

        $scope.billList = [];
        $scope.newBillList = [];
        $scope.disabled = true;
        $scope.disabled_printInv = true;

        //Add payment for row
        $scope.newPaymentItem = function (index) {
            $scope.billList[index].billableItems.push({ name: '', price: 0 });
            $scope.newBillList = $scope.billList;
        };

        $scope.removeBillableItem = function (parentIndex, index) {
            console.log("$scope.billList", $scope.billList);
            ($scope.billList[parentIndex].billableItems).splice(index, 1);
        };

        $scope.addNewPaymentGroup = function ($event) {
            var paymentItem = {
                visitPayment: $scope.visitPrice,
                billableItems: [],
                isBillPayed: false,
                previousDebt: $scope.visitData.patientId.previousDebt,
                open: true,
            }
            $scope.billList.push(paymentItem);
            $event.preventDefault();
        };


        //Add payment details 
        $scope.savePaymentDetails = function () {
            var paymentDetails = {};
            paymentDetails.billList = [];
            console.log("$scope.newBillList", $scope.newBillList);
            for (var i = 0; i < $scope.billList.length; i++) {
                if ($scope.billList[i].paymentType !== 'none') {
                    $scope.billList[i].isBillPayed = true;
                }
            }
            paymentDetails.billList = $scope.billList;
            paymentDetails.visitId = $scope.visitData._id;
            console.log("paymentDetails", paymentDetails);
            PatientService.savePaymentDetails().save(paymentDetails, function (response) {
                if (response.code == 200) {
                    console.log("Output Data", response.data);
                    if (response.data) {
                        $scope.billList = response.data.billList;
                    }
                    console.log("$scope.billList: After Save ", $scope.billList);
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Get payment data by id
        $scope.getPaymentDetailsByVisitId = function () {
            PatientService.getPaymentDetailsByVisitId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    console.log("getPaymentDetailsByVisitId");
                    console.log("response.data:--->", response.data);
                    if (response.data && response.data.paymentInfo && response.data.paymentInfo.billList) {
                        $scope.billList = response.data.paymentInfo.billList;
                    }
                    console.log("$scope.billList--->", $scope.billList);
                    $scope.visitPrice = response.data.visitPrice;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.sum = function (list, kupatPrice, previousDebt) {
            if (typeof kupatPrice === 'undefined' || !kupatPrice) {
                kupatPrice = 0;
            }
            if (typeof previousDebt === 'undefined' || !previousDebt) {
                previousDebt = 0;
            }
            var total = kupatPrice + previousDebt;
            angular.forEach(list, function (item) {
                total += parseInt(item.price);
            });
            return total;
        }

        $scope.issueInvLoader = false;
        $scope.emailInvLoader = false;

        //Issue invoice for visit
        $scope.issueInvoice = function (billData) {
            //console.log('issueInvoice');
            
            var paymentDetails = {};
            console.log("$scope.paymentData---->",$scope.paymentData);
            console.log("billData---->",billData);
            if ($scope.paymentData || billData.paymentType == 'cash') {
                if( billData.paymentType == 'cash'){
                   $scope.paymentData = {}                
                };
                paymentDetails.visitId = $scope.visitData._id;
                $scope.paymentData.billData = billData;
                paymentDetails.paymentData = $scope.paymentData;
                $scope.issueInvLoader = true;
                //console.log('payment: ', paymentDetails);
                PatientService.issueInvoice().save(paymentDetails, function (response) {
                    $scope.issueInvLoader = false;
                    if (response.code == 200) {
                        $scope.getPaymentDetailsByVisitId();
                        logger.logSuccess(response.message);
                        $scope.invoiceIssuedData = response.data;
                        if ($scope.invoiceIssuedData && $scope.invoiceIssuedData.doc_url) {
                            $scope.disabled_printInv = false;
                        }
                        //console.log('issueInvoice response: ', $scope.invoiceIssuedData);
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                bootbox.confirm('Please Select payment mode  and fill details of payment to issue invoice.',
                    function (result) {
                    }
                );
            }
        };

        //email invoice generated for visit
        $scope.emailInvoice = function (billData) {
            $scope.emailInvLoader = true;
            var invoiceDetails = {};
            invoiceDetails.visitId = $scope.visitData._id;
            if (billData.isDocIssued == true) {
                console.log("Already issued invocie", billData.invoiceIssuedData);
                invoiceDetails.invoiceIssuedData = billData.invoiceIssuedData;
            }
            else {
                console.log("New invocie", $scope.invoiceIssuedData);
                invoiceDetails.invoiceIssuedData = $scope.invoiceIssuedData;
            }
            console.log('emailInvoice response: ', $scope.invoiceIssuedData);
            PatientService.emailInvoice().save(invoiceDetails, function (response) {
                $scope.emailInvLoader = false;
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.printInvoice = function (billData) {
            if (billData.isDocIssued == true) {
                console.log("Already issued invocie", billData.invoiceIssuedData.doc_url);
                window.open(billData.invoiceIssuedData.doc_url, "_blank");
            }
            else {
                console.log("New once $scope.invoiceIssuedData.doc_url: ", $scope.invoiceIssuedData.doc_url);
                window.open($scope.invoiceIssuedData.doc_url, "_blank");
            }
        };

        //Enable invoice button for cash
        $scope.enableInvoiceButton = function (paymentType, billData) {
            if (paymentType == 'cash') {
                $scope.disabled = false;
                $scope.paymentData = {
                    billData: billData,
                    paidWithInfo: {

                    }
                };
            }
        };

        //--------------------------------PATIENT DASHBOARD SECTION----------------------------------
        //
        $scope.searchDebtTextField = '';
        $scope.showDebtStatus = 'NO';

        $scope.checkDebtStatus = function (filter) {
            $scope.showDebtStatus = filter;
            if (filter == 'NO') {
                $scope.searchDebtTextField = '';
                $scope.searchPatientDebt();
            }
            if (filter == 'YES') {
                $scope.searchPatientDebt();
            }
        };

        $scope.searchPatientDebt = function () {
            console.log("$scope.showDebtStatus", $scope.showDebtStatus);
            if ($scope.showDebtStatus === 'YES' || $scope.showDebtStatus === 'NO' && $scope.searchDebtTextField == '') { //Show filtered status
                ngTableParamsService.set('', '', $scope.searchDebtTextField, '');
                $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                    // counts: [],
                    getData: function ($defer, params) {
                        ngTableParamsService.set(params.page(), params.count(), $scope.searchDebtTextField, params.sorting());
                        $scope.paramUrl = params.url();
                        $scope.tableLoader = true;
                        $scope.debtList = [];
                        PatientService.getPatientDebt().get($scope.paramUrl, function (response) {
                            $scope.tableLoader = false;
                            $scope.debtList = response.data;
                            var data = response.data;
                            $scope.totalLength = response.totalLength;
                            params.total(response.totalLength);
                            $defer.resolve(data);
                        });
                    }
                });
            }
        };

        $scope.getViewVisitDetailsById = function (id) {
            PatientService.getVisitById($state.params.id).get(function (response) {
                //console.log("----getVisitById---", $state.params.id);
                console.log('response.data: ', response.data);
                $scope.selectedDiseaseList = [];
                if (response.code == 200) {
                    if (response.data.currentDisease) {
                        console.log('currentDisease: ');
                        for (var i = 0; i < response.data.currentDisease.length; i++) {
                            console.log('key: ', response.data.currentDisease[i]);
                            $scope.selectedDiseaseList.push(response.data.currentDisease[i].name);
                        }
                    }
                    console.log('value:', $scope.selectedDiseaseList);

                    $scope.visitData = response.data;
                    if ($scope.visitData) {
                        $scope.allergies = response.data.allergies.join(' , ');
                    }
                    if (response.data.isUrgent == true) {
                        $scope.isUrgent = true;
                    } else {
                        $scope.isUrgent = false;
                    }
                }
            });
        }

        $scope.getPatientDebt = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchDebtTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.debtList = [];
                    PatientService.getPatientDebt().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.debtList = response.data;
                        //console.log('$scope.debtList', $scope.debtList);
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        //-----------------------------------dashboard section------------------------------------------------------------------ 
        $scope.initializeDatepicker = function () {
            // $('#dateRange').daterangepicker();
            $('#dateRange').daterangepicker({
                "autoApply": true
            });
        };

        $scope.timeRange = '2';

        $scope.getPatientDashboardCount = function () {
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
            console.log('getPatientDashboardCount:---> ', $scope.timeRange);
            console.log('getPatientDashboardCount:---> ', $scope.dateRange);
            var details = {
                timeRangeType: $scope.timeRange,
                dateRange: dateRange
            }
            PatientService.getdashboardCount().get(details, function (response) {
                if (response.code == 200) {
                    console.log("getPatientDashboardCount Response--->", response.data);
                    $scope.counts = response.data;
                }
            });
        };

        //-----------------------------------dashboard section end------------------------------------------------------------------ 
        //-----------------------------------modal section------------------------------------------------------------------
        $scope.items = ["item1", "item"];
        $scope.openDilogue = function (a, id) {
            console.log(id, a);
            var modalInstance;
            modalInstance = $modal.open({
                templateUrl: '/modules/patient/Modals/' + a + 'Modal.html',
                controller: "ModalInstanceCtrl",
                resolve: {
                    items: function () {
                        return {
                            id: id
                        };
                    }
                }
            });
        };

        $scope.visitbyId = function () {
            console.log('visitbyId', $state.params.id);
            PatientService.visitbyId($state.params.id).get(function (response) {
                console.log(response)
                if (response.code == 200) {
                    $scope.patient = response.data;
                    var arr2 = $scope.patient.secondaryNo.split('-');
                    var Sprefix = '';
                    var Ssuffix = '';
                    if (arr2.length == 2) {
                        Sprefix = arr2[0];
                        Ssuffix = arr2[1];

                    } else if (arr2.length == 1) {

                        Ssuffix = arr2[0];
                        Sprefix = '';
                    }
                    $scope.Sprefix = Sprefix;
                    $scope.Ssuffix = Ssuffix;

                    var arr = $scope.patient.mobileNo.split('-');
                    var Mprefix = '';
                    var Msuffix = '';
                    if (arr.length == 2) {
                        Mprefix = arr[0];
                        Msuffix = arr[1];

                    } else if (arr.length == 1) {

                        Msuffix = arr[0];
                        Mprefix = '';
                    }
                    $scope.Mprefix = Mprefix;
                    $scope.Msuffix = Msuffix;
                    $scope.patient.familyDoctorId = $scope.patient.familyDoctorId._id;
                    $scope.patient.kupatCholim = $scope.patient.kupatCholim._id;

                    console.log(response.data);
                } else {
                    logger.logError(response.message);
                }

            }),
                function (response) {
                    logger.logError(response.message);

                }
        }

        $scope.addDoctorTreatment = function (isExitDashboard, stateToGo) {
            if ($scope.doctorTreatmentForm.$dirty) {
                var treatmentData = {};
                treatmentData.course = $scope.visitData.course;
                treatmentData.diagonosis = $scope.visitData.diagonosis;
                treatmentData.internalReferralComments = $scope.visitData.internalReferralComments;
                treatmentData.visitId = $state.params.id;
                console.log(treatmentData);
                PatientService.addDoctorTreatment().save(treatmentData, function (response) {
                    if (response.code == 200) {
                        $scope.getVisitById();
                        logger.logSuccess(response.message);
                        if (isExitDashboard) {
                            $state.go('visitCard', { id: $scope.visitData._id });
                        }
                        else if (stateToGo) {
                            $state.go(stateToGo, { id: $scope.visitData._id });
                        }
                        else {
                            $state.go('doctorPrescription', { id: $scope.visitData._id });
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
            else {
                console.log("else--->");
                if (isExitDashboard) {
                    console.log("isExitDashboard--->", isExitDashboard);
                    $state.go('visitCard', { id: $scope.visitData._id });
                }
                else if (stateToGo) {
                    console.log("stateToGo--->", stateToGo);
                    $state.go(stateToGo, { id: $scope.visitData._id });
                }
                else {
                    $state.go('doctorPrescription', { id: $scope.visitData._id });
                }
            }
        };


        $scope.openPaymentModal = function (paymentType, billData) {
            console.log(paymentType);
            var modalInstance;
            if (paymentType == 'cash') {
                $scope.disabled = false;
            }
            $scope.paymentData = {
                //    billData: billData,
                paidWithInfo: {

                }
            };
            console.log("before", !Object.keys($scope.paymentData.paidWithInfo).length);
            modalInstance = $modal.open({
                templateUrl: '/modules/patient/Modals/' + paymentType + 'Modal.html',
                controller: "PaymentModalInstanceCtrl",
                resolve: {
                    paymentData: function () {
                        return $scope.paymentData;
                    }
                }
            });

            modalInstance.result.then(function (paymentData) {
                //    console.log("Selected item:", paymentData);
                //   console.log("Before:", $scope.paymentData);
                $scope.disabled = !Object.keys($scope.paymentData.paidWithInfo).length;
                //   console.log("After result", !Object.keys($scope.paymentData.paidWithInfo).length);
            }, function () {
                console.log("result");
            });
        };
        $scope.patient = {};
        $scope.patientData = {};
        $scope.ageCalculate = function (dob) {
            var age = {};
            var today = new Date();
            var birthDate = new Date(dob);
            console.log("today", today);
             console.log("birthDate", birthDate);

            var year = today.getFullYear() - birthDate.getFullYear();
            console.log("today.getFullYear()", today.getFullYear());
            console.log("birthDate.getFullYear()", birthDate.getFullYear());
              console.log("year", year);
           var month = today.getMonth() - birthDate.getMonth();
             console.log("month", month);
            var day = today.getDate() - birthDate.getDate();
            console.log("day", day);
            // if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
            if (month < 0){
                year--;
                month = (12 + month);
            }
            if (today.getDate() < birthDate.getDate()) {
                console.log("---in fi-");
                month--;
                day = 30 + day;
             }
            age.month = month >= 0 ? month : 0;
            age.day = day >= 0 ? day : 0;
            age.year = year >= 0 ? year : 0;
            $scope.patientData.age = age;
            $scope.patient.age = age;
        }


    }]);

MCSIApp.controller("PaymentModalInstanceCtrl", ['$scope', '$rootScope', '$localStorage', '$location', '$translate', 'HomeService', '$modal', '$modalInstance', 'PatientService', 'paymentData',
    function ($scope, $rootScope, $localStorage, $location, $translate, HomeService, $modal, $modalInstance, PatientService, paymentData) {
        $scope.currentDate = new Date();
        console.log('paymentData: payment modal', paymentData);
        $scope.paymentData = paymentData;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.ok = function () {
            $modalInstance.close($scope.paymentData);
        };
    }]);

MCSIApp.controller('ModalInstanceCtrl', ['$scope', '$rootScope', '$location', '$modalInstance', '$localStorage', '$filter', '$modal', '$http', '$window', 'ngTableParams', 'ngTableParamsService', '$state', 'logger', 'CommonService', 'PatientService', 'Upload', 'DiseaseService', 'items',
    function ($scope, $rootScope, $location, $modalInstance, $localStorage, $filter, $modal, $http, $window, ngTableParams, ngTableParamsService, $state, logger, CommonService, PatientService, Upload, DiseaseService, items) {

        $scope.visitReason = {};
        $scope.newvisitReason = {};
        $scope.visitReason.isUrgent = 0;
        $scope.newvisitReason.isUrgent = 0;

        $scope.tabs = [{
            slug: 'basic',
            name: "Basic",
            checked: 3,
            finding: ''
        }, {
            slug: 'head',
            name: "Head",
            checked: 3,
            finding: ''
        }, {
            slug: 'eent',
            name: "EENT",
            checked: 3,
            finding: ''
        },
        {
            slug: 'heart',
            name: "Heart",
            checked: 3,
            finding: ''
        },
        {
            slug: 'lungs',
            name: "Lungs",
            checked: 3,
            finding: ''
        },
        {
            slug: 'skin',
            name: "Skin",
            checked: 3,
            finding: ''
        }
        ];



        $scope.getVisitById = function () {
            var diseaseName = [];
            //   $scope.$emit('start', true);
            PatientService.getVisitById($state.params.id).get(function (response) {
                if (response.code == 200) {
                    console.log("getVisitById Response Data: ", response.data);
                    $scope.visitData = response.data;
                    $scope.patientData = response.patientData;
                    if (response.data.patientId) {
                        $scope.allergies = response.data.patientId.allergies.join(' , ');
                    }
                    for (var i = 0; i < response.data.currentDisease.length; i++) {
                        diseaseName.push(response.data.currentDisease[i].name);
                    }
                    $scope.diseaseName = diseaseName.join(' , ');
                    $scope.patient = $scope.visitData.patientId;
                    var extreferral = $scope.visitData.treatmentResultType;

                    if (extreferral == 'External Referral') {
                        $scope.extreferral = true;
                        // $scope.savedExtRef = true;
                    }
                    if (response.data.isUrgent == true) {
                        $scope.isUrgent = true;
                    } else {
                        $scope.isUrgent = false;
                    }
                    console.log("Visit Comments: ", $scope.visitCommentList);
                    $scope.visitCommentList = $scope.visitData.visitComment;
                } else {
                    logger.logError(response.message);
                }
                //   $scope.$emit('stop', true);
            })

        };

        $scope.getVisitDetailsById = function (id) {
            DiseaseService.getalldisease().get(function (response) {
                if (response.code == 200) {
                    $scope.diseaselist = response.data;
                    $scope.modifiedList = [];
                    //console.log("diseaslist", $scope.diseaselist);
                    for (var i = 0; i < $scope.diseaselist.length; i++) {
                        var obj = {
                            _id: $scope.diseaselist[i]._id,
                            name: $scope.diseaselist[i].name,
                            ticked: false
                        };
                        $scope.modifiedList.push(obj);
                    }
                    PatientService.getVisitById($state.params.id).get(function (response) {
                        //console.log("----getVisitById---", $state.params.id);
                        if (response.code == 200 && response.data.currentDisease) {
                            for (var i = 0; i < response.data.currentDisease.length; i++) {
                                for (var j = 0; j < $scope.modifiedList.length; j++) {
                                    if (response.data.currentDisease[i]._id == $scope.modifiedList[j]._id) {
                                        $scope.modifiedList[j].ticked = true;
                                        break;
                                    }
                                }
                            }
                            $scope.visitData = response.data;
                            if ($scope.visitData) {
                                $scope.visitData.modifiedCurrentDisease = [];
                                $scope.allergies = response.data.allergies.join(' , ');
                            }
                            if (response.data.isUrgent == true) {
                                $scope.isUrgent = true;
                            } else {
                                $scope.isUrgent = false;
                            }
                        } else {
                            logger.logError(response.message);
                        }
                    });
                } else {
                    logger.logError(response.message);
                }
            });
        };


        $scope.getViewVisitDetailsById = function (id) {
            PatientService.getVisitById($state.params.id).get(function (response) {
                //console.log("----getVisitById---", $state.params.id);
                console.log('response.data: ', response.data);
                $scope.selectedDiseaseList = [];
                if (response.code == 200) {
                    if (response.data.currentDisease) {
                        console.log('currentDisease: ');
                        for (var i = 0; i < response.data.currentDisease.length; i++) {
                            console.log('key: ', response.data.currentDisease[i]);
                            $scope.selectedDiseaseList.push(response.data.currentDisease[i].name);
                        }
                    }
                    console.log('value:', $scope.selectedDiseaseList);

                    $scope.visitData = response.data;
                    if ($scope.visitData) {
                        $scope.allergies = response.data.allergies.join(' , ');
                    }
                    if (response.data.isUrgent == true) {
                        $scope.isUrgent = true;
                    } else {
                        $scope.isUrgent = false;
                    }
                }
            });
        }

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $(document).ready(function () {
            $(".fancybox").fancybox();
        });

        $scope.getFamilyDoctor = function () {
            PatientService.getFamilyDoctor().get(function (response) {
                if (response.code == 200) {
                    $scope.familydoctor = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };



        $scope.getStageInfoById = function () {
            $scope.$emit('start', true);
            PatientService.getStageInfoById($state.params.id).get(function (response) {
                // console.log("----getStageInfoById---", $state.params.id);
                if (response.code == 200) {
                    if (response.data && response.data.stages && response.data.mainStage) {
                        $scope.stageData = response.data.stages;
                        $scope.mainStages = response.data.mainStage;
                        // console.log('stageData', $scope.stageData);
                    }
                } else {
                    logger.logError(response.message);
                }
                $scope.$emit('stop', true);
            });
        };
        $scope.nurseTest = [];
        $scope.doctorTest = [];

        //Get nurse test for current diseases
        $scope.getNurseTestByCurrentDisease = function (id) {
            //  console.log('controller');
            PatientService.getPatientVisitTest($state.params.id).get(function (response) {
                //   console.log('getPatientVisitTest', response.data);
                if (response.code == 200) {
                    $scope.nurseTest = [];
                    $scope.doctorTest = [];
                    if (response.data) {
                        if (response.data.nurseTest) {
                            $scope.nurseTest = response.data.nurseTest;
                            for (var i = 0; i < $scope.nurseTest.length; i++) {
                                if ($scope.nurseTest[i].comment == '') {
                                    $scope.nurseTest[i].isChecked = false;
                                }
                                else {
                                    $scope.nurseTest[i].isChecked = true;
                                }
                            }
                        }
                        if (response.data.doctorTest) {
                            $scope.doctorTest = response.data.doctorTest;
                            for (var i = 0; i < $scope.doctorTest.length; i++) {
                                if ($scope.doctorTest[i].comment == '') {
                                    $scope.doctorTest[i].isChecked = false;
                                }
                                else {
                                    $scope.doctorTest[i].isChecked = true;
                                }
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };
        $scope.getDoctorList = function () {
            PatientService.getDoctorList().get(function (response) {
                if (response.code == 200) {
                    //   console.log('response doctor list', response.data);
                    $scope.drlist = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };


        $scope.getTriageTestByVisitId = function (id) {
            PatientService.getTriageTestByVisitId($state.params.id).get(function (response) {
                //console.log("----getTriageTestByVisitId---", $state.params.id);
                if (response.code == 200) {
                    if (response.data && response.data.triageTest) {
                        $scope.triageData = response.data;
                        $scope.triageTestList = response.data.triageTest;
                    }
                    //console.log("In getTriageTestByVisitId", $scope.triageTestList);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.getVisitDoctorExamById = function (id) {
            PatientService.getVisitById($state.params.id).get(function (response) {
                console.log("----getVisitDoctorExamById---", response.data);
                if (response.data.patientId) {
                    $scope.allergies = response.data.patientId.allergies.join(' , ');
                }
                if (response.code == 200) {
                    for (var i = 0; i < response.data.phyExam.length; i++) {
                        for (var j = 0; j < $scope.tabs.length; j++) {
                            $scope.tabs[j].checked = response.data.phyExam[j].value;
                            $scope.tabs[j].finding = response.data.phyExam[j].finding;
                        }
                    }
                    console.log('$scope.tabs', $scope.tabs);
                    $scope.visitData = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };
        $scope.getPatientEmcPrescription = function () {
            PatientService.getPrescriptions($state.params.id).get(function (response) {
                if (response.code == 200) {
                    if (response.data) {
                        {
                            if (response.data.emcOrder) {
                                $scope.emcOrders = response.data.emcOrder;
                                console.log("EMC prescriptions", $scope.emcOrders);
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.emcOrders = [];
        $scope.extOrders = [];
        $scope.drOrders = [];

        //Get prescription for visit by visit id
        $scope.getPrescriptionById = function (id) {
            $scope.isExtOrderSaved = false;
            PatientService.getPrescriptions($state.params.id).get(function (response) {
                //console.log("----getPrescriptionById---", $state.params.id);
                if (response.code == 200) {
                    if (response.data) {
                        {
                            if (response.data.emcOrder) {
                                $scope.emcOrders = response.data.emcOrder;
                            }
                            if (response.data.extOrder) {
                                $scope.extOrders = response.data.extOrder;
                                if (response.data.extOrder.length > 1) {
                                    $scope.isExtOrderSaved = true;
                                }
                            }
                        }
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.getPaymentDetailsByVisitId = function () {
            PatientService.getPaymentDetailsByVisitId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    console.log("getPaymentDetailsByVisitId");
                    if (response.data && response.data.paymentInfo && response.data.paymentInfo.billList) {
                        $scope.billList = response.data.paymentInfo.billList;
                    }
                    console.log("$scope.billList--->", $scope.billList);

                    console.log("$scope.billList--->", $scope.billList);
                    //  if (response.data && response.data.billList) {
                    //  $scope.billList = response.data.billList;
                    for (var i = 0; i < $scope.billList.length; i++) {
                        var billableItems = $scope.billList[i].billableItems;
                        var total = 0;
                        for (var j = 0; j < billableItems.length; j++) {
                            total += billableItems[j].price;
                        }
                        $scope.billList[i].total = total + $scope.billList[i].previousDebt + $scope.billList[i].visitPayment;
                    }
                    // }
                } else {
                    logger.logError(response.message);
                }
            });
        };

    }]);




