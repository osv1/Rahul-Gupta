"use strict"

angular.module("Kupat")

.factory('kupatCholimService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {
/**
 * Function is use to Kupat Cholim Modules  
 * @access private
 * @return json
 * Created by Rahul 
 * @smartData Enterprises (I) Ltd
 * Created Date 26-May-2017
 */
    var addkupatCholim = function() {
        return $resource('/api/addkupatCholim', null, {
            save: {
                method: 'POST'
            }
        });
    }

    


var getkupatCholim = function() {
        return $resource('/api/getkupatCholim', null, {
            get: {
                method: 'GET'
            }
        });
    }       

   
  var deletekupatCholimbyId = function(id) {
       
        return $resource('/api/deletekupatCholimbyId/'+ id, null, {

            delete: {
                method: 'DELETE',
                id: '@id'
            }
        });
    }  

var updatekupatCholim = function(id) {
        return $resource('/api/updatekupatCholim/'+id, null, {
            save: {
                method: 'PUT',
                 id: '@id'
            }
        });
    }
var getkupatCholimbyId = function(id) {
        return $resource('/api/getkupatCholimbyId/'+id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    }



    return {
        addkupatCholim: addkupatCholim,
        getkupatCholim: getkupatCholim,
        deletekupatCholimbyId: deletekupatCholimbyId,
        updatekupatCholim: updatekupatCholim,
        getkupatCholimbyId: getkupatCholimbyId

        
    }

}]);
