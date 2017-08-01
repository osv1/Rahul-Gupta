"use strict";

angular.module("Reports")

MCSIApp.controller('reportController', ['$scope', '$rootScope', '$location','$ocLazyLoad', '$localStorage', 'ngTableParams', 'ngTableParamsService', 'logger', 'ReportService', 'CommonService','PatientService', '$window',
    function ($scope, $rootScope, $location,$ocLazyLoad, $localStorage, ngTableParams, ngTableParamsService, logger, ReportService, CommonService, PatientService, $window) {

        $scope.showVisitResultsReport = false;
        $scope.loader = false;

  
       var getData = ngTableParamsService.get();
        $scope.generateVisitResultsReport = function () {
            console.log('---generateVisitResultsReport---');
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
            $scope.showVisitResultsReport = true;
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.list = [];
                    $scope.paramUrl.dateRange = dateRange;
                    ReportService.getVisitResultsReport().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data.data);
                        $scope.list = response.data.data;
                        $scope.fileToExport = response.data.file;
                        var data = response.data;
                        $scope.totalLength = response.data.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.exportToExcel = function (type) {
            var id = type + '_' + $scope.fileToExport;
            console.log(" exportToExcel Id: ", id);
            window.open(baseUrl + '/exportToExcel/' + id, '_blank');
        };

        var getData = ngTableParamsService.get();
        $scope.generateCurrentDiseaseReport = function () {
            console.log('---generateCurrentDiseaseReport---');
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
            $scope.showCurrentDiseaseReport = true;
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.currentDiseaseList = [];
                    $scope.paramUrl.dateRange = dateRange;
                    ReportService.getCurrentDiseaseReport().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data.data);
                        $scope.currentDiseaseList = response.data.data;
                        $scope.fileToExport = response.data.file;
                        var data = response.data;
                        $scope.totalLength = response.data.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        var getData = ngTableParamsService.get();
        $scope.generateInvChangesReport = function () {
            console.log('---generateInvChangesReport---');
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
            $scope.showInvChangesReport = true;
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.invChangeList = [];
                    $scope.paramUrl.dateRange = dateRange;
                    ReportService.getInvChangesReport().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data.data);
                        $scope.invChangeList = response.data.data;
                        $scope.fileToExport = response.data.file;
                        var data = response.data;
                        $scope.totalLength = response.data.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.generateDrugsGiveAwayReport = function () {
            console.log('---generateDrugsGiveAwayReport---');
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
            $scope.showDrugGiveAwayReport = true;
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
               
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.drugsGiveAwayList = [];
                    $scope.paramUrl.dateRange = dateRange;
                    ReportService.getDrugsGiveAwayReport().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data.data);
                        $scope.drugsGiveAwayList = response.data.data;
                        $scope.fileToExport = response.data.file;
                        var data = response.data;
                        $scope.totalLength = response.data.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getReportGeneratedHistory = function (reportType) {
            console.log('---getReportHistory---');
            console.log('reportType: ', reportType);
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.list = [];
                    $scope.paramUrl.reportType = reportType;
                    ReportService.getReportGeneratedHistory().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data);
                        $scope.list = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });

        };

         $scope.downloadOrViewReport = function (reportType, reportId) {
            var id = reportType + '_' + reportId;
            console.log(" downloadOrViewReport Id: ", id);
            window.open(baseUrl + '/downloadOrViewReport/' + id, '_blank');
            window.close();
        };
        
         $scope.generateKupatCholimReport = function () {
            console.log('---generateKupatCholimReport---');
            var dateRange = angular.element($('#dateRange')).val();
            console.log('dateRange', dateRange);
             console.log('kupatCholim', $scope.kupatCholim);
            var kupatKholim = $scope.kupatCholim;
            console.log('kupatKholim', kupatKholim);
            $scope.showKupatCholimReport = true;
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                counts: [],
                getData: function ($defer, params) {
                    ngTableParamsService.set(params.page(), params.count(), '', params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.list = [];
                    $scope.paramUrl.dateRange = dateRange;
                    $scope.paramUrl.kupatKholim = kupatKholim;
                    ReportService.getKupatCholimReport().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        console.log('response.data:', response.data.data);
                         console.log('response.file:', response.data);
                        $scope.list = response.data.data;
                        var data = response.data;
                        $scope.fileToExport = response.data.file;
                        $scope.totalLength = response.data.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getkupatCholim = function () {
             console.log("getkupatCholim: ");
              PatientService.getkupatCholim().get(function (response) {
                if (response.code == 200) {
                    $scope.kupatCholimlist = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };

        $scope.showReport = function (reportType, reportId) {
            var id = reportType + '_' + reportId;
            console.log(" showReport Id: ", id);
              ReportService.showReport(id).get(function (response) {
                if (response.code == 200) {
                    console.log("showReport response--->", response.data.html);
                     var newWindow = window.open();
                     console.log("newWindow-->", newWindow);
                      newWindow.document.writeln(response.data.html);
                      newWindow.document.close();
                } else {
                    logger.logError(response.message);
                }
            });
        };
        
    }]);


