"use strict"

angular.module("Reports")

    .factory('ReportService', ['$http', 'communicationService', '$resource', function ($http, communicationService, $resource) {
        /**
         * Function is use to User Modules changes are here 
         * @access private
         * @return json
         * Created by sunny 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-April-2017
         */
        var getVisitResultsReport = function () {
            return $resource('/api/getVisitResultsReport', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var exportToExcelVisitResultsReport = function () {
            return $resource('/api/exportToExcelVisitResultsReport', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var getCurrentDiseaseReport = function () {
            return $resource('/api/getCurrentDiseaseReport', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var getInvChangesReport = function () {
            return $resource('/api/getInvChangesReport', null, {
                get: {
                    method: 'POST'
                }
            });
        }

         var getDrugsGiveAwayReport = function () {
            return $resource('/api/getDrugsGiveAwayReport', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var getReportGeneratedHistory = function () {
            return $resource('/api/getReportGeneratedHistory', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var getKupatCholimReport = function () {
            return $resource('/api/getKupatCholimReport', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var showReport = function (id) {
            return $resource('/api/showReport/' + id, null, {
                get: {
                    method: 'GET',
                     id: '@id'
                }
            });
        }

        return {
           getVisitResultsReport : getVisitResultsReport,
           exportToExcelVisitResultsReport: exportToExcelVisitResultsReport,
           getCurrentDiseaseReport: getCurrentDiseaseReport,
           getInvChangesReport: getInvChangesReport,
           getDrugsGiveAwayReport: getDrugsGiveAwayReport,
           //History Reports
           getReportGeneratedHistory: getReportGeneratedHistory,
           getKupatCholimReport: getKupatCholimReport,
           showReport: showReport
           
        };

    }]);
