  'use strict';

  angular.module("Roles")
  
  // Initiate the service
.factory('RolesServ', ['$resource', function($resource) {
      return {
      roles : function () {
        return $resource('/api/roles/:id', null, {
          'update'  : {method : 'PUT'},
          'get'     : {method : 'GET', id : '@id'},
          'delete'  : {method : 'DELETE', id : '@id'},
          'save'    : {method : 'POST'}
        });
      },
      rolePermissions : function () {
        return $resource('/api/roles/update_permission/:id', null, {
          'update'  : {method : 'PUT'}
        });
      },
      permissions : function () {
        return $resource('/api/permissions');
      }      
    };
}]);
