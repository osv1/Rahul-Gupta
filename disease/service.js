
"use strict"

angular.module("Disease")

.factory('DiseaseService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {

/**
 * Function is use to Disease Modules 
 * @access private
 * @return json
 * Created by Rahul
 * @smartData Enterprises (I) Ltd
 * Created Date 26-April-2017
 */
	var getalldisease = function() {
        return $resource('/api/getalldisease', null, {
            get: {
                method: 'GET'
            }
        });
    }
    var addnewdisease = function() {
        return $resource('/api/addnewdisease', null, {
            save: {
                method: 'POST'
            }
        });
    }
       

    var getdiseasebyId = function(id) {
        console.log("id",id);
        return $resource('/api/getdiseasebyId/'+ id, null, {

            get: {
                method: 'GET',
                id: '@id'
            }
        });
    } 

 var deletedisease = function(id) {
       
        return $resource('/api/deletediseasebyId/'+ id, null, {

            delete: {
                method: 'DELETE',
                id: '@id'
            }
        });
    } 

      var updateindex = function() {
        return $resource('/api/updateindex', null, {
            save: {
                method: 'POST'
            }
        });
    }

   var getallIndex = function() {
        return $resource('/api/getAllIndex', null, {
            get: {
                method: 'GET'
            }
        });
   }

//     var getallIndex = function() {
//         return $resource('/api/getAllIndex', null, {
//             get: {
//                 method: 'POST'
//             }
//         });
//    }
  
   
   
   var getIndexTitleList = function() {
        return $resource('/api/getIndexTitleList/:indexType', null, {
            get: {
                method: 'GET'
            }
        });
    }
    var addIndex = function() {
        return $resource('/api/addIndex', null, {
            save: {
                method: 'POST'
            }
        });
    }

    //by sunny on 29/april/2017
    var getTriagebyId = function(id) {
        return $resource('/api/getTriagebyId/'+id, null, {
            get: {
                method: 'GET',
                id: '@id'
            }
        });
    }

    var updatetest = function() {
        return $resource('/api/updatetest/', null, {
            save: {
                method: 'POST'
            }
        });
    }
    // End on 29/april/2017 
  return {
        getalldisease: getalldisease,
        addnewdisease: addnewdisease,
        getdiseasebyId: getdiseasebyId,
        updateindex: updateindex,
        getallIndex: getallIndex,
        getIndexTitleList:getIndexTitleList,
        addIndex:addIndex,
        getTriagebyId:getTriagebyId,
        deletedisease: deletedisease,
        updatetest: updatetest
    }

}]);     
