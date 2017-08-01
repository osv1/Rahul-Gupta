"use strict"

angular.module("Inventory")

.factory('InventoryService', ['$http', 'communicationService', '$resource', function($http, communicationService, $resource) {
    
    var getDrugList = function () {
        console.log("service getDrugList");
        return $resource('/api/getDrugList', null, {
            get: {
                method: 'GET'
            }
        });
    }
    
     var getDrugs = function () {
        console.log("service getDrugs");
        return $resource('/api/getDrugs', null, {
            get: {
                method: 'GET'
            }
        });
    }


    var addNewDrug = function() {
        return $resource('/api/addNewDrug', null, {
            save: {
                method: 'POST'
            }
        });
    }

    var deleteDrug = function(id,to) {
        return $resource('/api/deleteDrug/:id/:to', null, {
            delete: {
                method: 'DELETE',
                id: '@id',
                to: '@to'
            }
        });
    }
    return {
        getDrugList:getDrugList,
        getDrugs:getDrugs,
        addNewDrug:addNewDrug,
        deleteDrug:deleteDrug
    }

}]);
