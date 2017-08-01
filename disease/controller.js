
"use strict";


angular.module("Disease")


MCSIApp.controller('diseaseController', ['$scope', '$state', '$rootScope', '$location','$ocLazyLoad', '$localStorage', 'ngTableParams', 'ngTableParamsService', 'logger', 'DiseaseService', 'CommonService',
    function ($scope, $state, $rootScope, $location,$ocLazyLoad, $localStorage, ngTableParams, ngTableParamsService, logger, DiseaseService, CommonService) {
        /**
         * Function is use to Disease Modules 
         * @access private
         * @return json
         * Created by Rahul
         * @smartData Enterprises (I) Ltd
         * Created Date 26-April-2017
         */
        $scope.nurse = [{ nurseTest: "" }];

        $scope.addnurseTest = function ($event) {
            var nurseTest = { nurseTest: "" };
            $scope.nurse.push(nurseTest);
            $event.preventDefault();
        }


        $scope.removeNurseTest = function () {
            var lastItem = $scope.nurse.length - 1;
            $scope.nurse.splice(lastItem);
        }

        $scope.doctor = [{ doctorTest: "" }];
        $scope.addDoctorTest = function () {
            var doctorTest = { doctorTest: "" };
            $scope.doctor.push(doctorTest);
        }
        $scope.removeDoctorTest = function () {
            var lastItem = $scope.doctor.length - 1;
            $scope.doctor.splice(lastItem);
        }


        $scope.addnewdisease = function (disease) {
            disease.nurseTest = [];
            disease.doctorTest = [];
            disease.nurseTest = $scope.nurse;
            disease.doctorTest = $scope.doctor;
            DiseaseService.addnewdisease().save(disease, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('Diseases');
                } else {
                    logger.logError(response.message);
                }
            }, function (response) {

            });
        };

        var getData = ngTableParamsService.get();
        $scope.searchTextField = getData.searchText;
        $scope.searchingdisease = function () {
            ngTableParamsService.set('', '', $scope.searchTextField, '');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.diseaseList = [];
                    DiseaseService.getalldisease().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.diseaseList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getalldisease = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.diseaseList = [];
                    DiseaseService.getalldisease().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.diseaseList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };



        $scope.getAllDisease = function () {
            DiseaseService.getalldisease().get(function (response) {
                if (response.code == 200) {
                    $rootScope.diseaselist = response.data;
                    logger.logSuccess(response.message)
                } else {
                    logger.logError(response.message)
                }
            })
        }

        $scope.getdiseasebyId = function (id) {
            DiseaseService.getdiseasebyId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    $scope.diseaseName = response.data.name;
                    $rootScope.diseaseid = response.data;
                    $scope.allTestList = [];
                    $scope.doctor = response.data.doctorTest;
                    $scope.nurse = response.data.nurseTest;
                    var i = 0;
                    var len = Math.max(response.data.nurseTest.length, response.data.doctorTest.length);
                    while (i < len) {
                        $scope.allTestList.push({
                            nurseTest: response.data.nurseTest[i] || null,
                            doctorTest: response.data.doctorTest[i] || null
                        });
                        i++;
                    }
                } else {
                    logger.logError(response.message);
                }

            })
        }

        $scope.deletedisease = function (id) {
            bootbox.confirm('Are you sure you want to delete this disease', function (r) {
                if (r) {
                    DiseaseService.deletedisease(id).delete(function (response) {
                        if (response.code == 200) {
                            logger.logSuccess(response.message);

                        } else {
                            logger.logError(response.message);
                        }
                        $scope.getalldisease();
                    })
                }
            })
        }

        $scope.updateindex = function (index) {
            DiseaseService.updateindex().save($scope.diseaseid, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        }

        $scope.getallIndex = function () {
            DiseaseService.getallIndex().get(function (response) {
                if (response.code == 200) {
                    $scope.indexList = response.data;
                } else {
                    logger.logError(response.message);
                }
            })
        }


        $scope.getIndexTitleList = function (index) {
            if (index == 'Disease') {
                $scope.index2 = undefined;
            }
            if (index == 'Triage') {
                $scope.index1 = undefined;
            }
            var params = {
                indexType: index
            }

            DiseaseService.getIndexTitleList().get(params, function (response) {
                if (response.code == 200) {
                    $scope.indexList = response.data;
                } else {
                    logger.logError(response.message);
                }
            })
        }

        $scope.addIndex = function (index, indexType) {
            if (indexType == 'Disease') {
                var index3 = {
                    _id: index._id,
                    alertFreqency: index.alertFreqency,
                    indexType: indexType.indexType
                }
            }
            else {
                var index3 = {
                    _id: index._id,
                    minRange: index.minRange,
                    maxRange: index.maxRange,
                    alertFreqency: index.alertFreqency,
                    indexType: indexType.indexType
                }
            }

            DiseaseService.addIndex().save(index3, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('index');
                } else {
                    logger.logError(response.message);
                }
            }, function (response) {

            });
        };

        $scope.editIndex = function (index) {
            DiseaseService.addIndex().save(index, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('index');
                } else {
                    logger.logError(response.message);
                }
            }, function (response) {

            });
        };

        $scope.editIndexList = function (id, indexType) {
            if (indexType == 'Triage') {
                $location.path('/indexList/edittriage/' + id);
            } else {
                $location.path('/indexList/editdisease/' + id);
            }
        }

        $scope.getTriagebyId = function () {
            DiseaseService.getTriagebyId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    $rootScope.triageId = response.data;
                } else {
                    logger.logError(response.message);
                }
            })

        }

        $scope.updateTest = function (allTestList) {
            var disease = {};
            disease.test = allTestList;
            disease.id = $state.params.id;
            disease.nurseTest = $scope.nurse;
            disease.doctorTest = $scope.doctor;
            DiseaseService.updatetest().save(disease, function (response) {

                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('Diseases');

                } else {
                    logger.logError(response.message);
                }
            });
        }
    }]);
