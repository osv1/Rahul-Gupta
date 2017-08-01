"use strict"

angular.module("Home")

.factory('HomeService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {

    var getCounts = function() {
        return $resource('/api/dashboardCount', null, {
            get: {
                method: 'GET'
            }
        });
    }
     var updateLanguage = function() {
        return $resource('/api/updateLanguage', null, {
            save: {
                method: 'POST'
            }
        });
    }

  

    return {
        getCounts: getCounts,
        updateLanguage:updateLanguage
        
    }

}]);
