"use strict"

angular.module("Survey")

.factory('SurveyService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {

     var addSurvey = function() {
        return $resource('/api/addSurvey', null, {
            save: {
                method: 'POST'
            }
        });
    }
       
   var getSurveyDetails = function() {
        return $resource('/api/getSurveySetByAdmin', null, {
            get: {
                method: 'GET'
            }
        });
    }

     var getSurveyById = function () {
            return $resource('/api/getSurveyById/', null, {
                save: {
                    method: 'POST',
                }
            });
    };

    var submitSurvey = function() {
        return $resource('/api/submitSurvey', null, {
            save: {
                method: 'POST'
            }
        });
    };

    return {
        addSurvey: addSurvey,
        getSurveyDetails: getSurveyDetails,
        getSurveyById: getSurveyById,
        submitSurvey: submitSurvey
    }

}]);

