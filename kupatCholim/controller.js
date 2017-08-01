"use strict";


angular.module("Kupat")



MCSIApp.controller('kupatCholimController', ['$scope', '$rootScope', '$location', '$ocLazyLoad', '$localStorage', 'ngTableParams', 'ngTableParamsService', '$state', 'logger', 'CommonService', 'kupatCholimService',
    function ($scope, $rootScope, $location, $ocLazyLoad, $localStorage, ngTableParams, ngTableParamsService, $state, logger, CommonService, kupatCholimService) {
           
    $scope.kupatCholim = {};
    var startDate= "Friday: 07:00 AM-Sunday: 06:59 AM";
    $scope.kupatCholim.weekendDayRange = startDate;
    

        /**
         * Function is use to add Kupat Cholim   
         * @access private
         * @return json
         * Created by Rahul 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-May-2017
         */

        $scope.addkupatCholim = function (kupatCholim) {
            var data = kupatCholim;
            data.weekendPriceSet = $scope.weekendPriceList;
            kupatCholimService.addkupatCholim().save(data, function (response) {
                console.log('response', response);
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('kupatCholim_list');
                } else {
                    logger.logError(response.message);
                }
            });
        }
        /**
         * Function is use to get Kupat Cholim 
         * @access private
         * @return json
         * Created by Rahul 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-May-2017
         */
        var getData = ngTableParamsService.get();
        $scope.searchTextField = getData.searchText;
        $scope.searching = function () {
            ngTableParamsService.set('', '', $scope.searchTextField, '');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.kupatCholimlist = [];
                    kupatCholimService.getkupatCholim().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.kupatCholimlist = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getkupatCholim = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.kupatCholimlist = [];
                    kupatCholimService.getkupatCholim().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.kupatCholimlist = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };
        /**
         * Function is use to delete Kupat Cholim by ID  
         * @access private
         * @return json
         * Created by Rahul 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-May-2017
         */
        $scope.deletekupatCholimbyId = function (id) {
            bootbox.confirm('Are you sure you want to delete this kupatCholim', function (r) {
                if (r) {
                    kupatCholimService.deletekupatCholimbyId(id).delete(function (response) {
                        if (response.code == 200) {
                            logger.logSuccess(response.message);

                        } else {
                            logger.logError(response.message);
                            console.log(response);
                        }
                        $scope.getkupatCholim();
                    })
                }
            })
        }

        /**
         * Function is use to get Kupat Cholim by ID  
         * @access private
         * @return json
         * Created by Rahul 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-May-2017
         */
        $scope.getkupatCholimbyId = function (id) {
            kupatCholimService.getkupatCholimbyId($state.params.id).get(function (response) {
                console.log(response);
                if (response.code == 200) {
                    $scope.kupatid = response.data;
                    $scope.weekendPriceList = response.data.weekendPriceSet;
                    console.log("$scope.weekendPriceList------------>",$scope.weekendPriceList);
                    console.log(response.data);
                } else {
                    logger.logError(response.message);
                }
            }),
            function (response) {
                logger.logError(response.message);
            }
        }

        /**
         * Function is use to update Kupat Cholim   
         * @access private
         * @return json
         * Created by Rahul 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-May-2017
         */
        $scope.updatekupatCholim = function (kupatCholim, id) {
            console.log(kupatCholim);
            kupatCholim.weekendPriceSet = $scope.weekendPriceList;
            kupatCholimService.updatekupatCholim($state.params.id).save(kupatCholim, function (response) {

                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('kupatCholim_list');

                } else {
                    logger.logError(response.message);
                }
            });
        }

        $scope.weekendPriceList = [];

        //Add payment for row
        $scope.addNewWeekendPriceSet = function ($event) {
            $scope.weekendPriceList.push({ title: '', dateRange: '', price: 0 });
            $event.preventDefault();
        };

        //Remove selected row from weekend price set
        $scope.removeWeekendPriceSet = function () {
            var newDataList = [];
            $scope.selectedAll = false;
            angular.forEach($scope.weekendPriceList, function (selected) {
                if (!selected.selected) {
                    newDataList.push(selected);
                }
            });
            $scope.weekendPriceList = newDataList;
        };

    }]);