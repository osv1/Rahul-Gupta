'use strict';
// module
angular.module("Roles")

// Controller
MCSIApp.controller('roleController', ['$scope', 'RolesServ', '$location','$ocLazyLoad', '$stateParams', '$state', 'logger', 'ngTableParams',
    function ($scope, RolesServ, $location,$ocLazyLoad, $stateParams, $state, logger, ngTableParams) {
        $scope.roleList = '';
        $scope.roleForm = {};
        $scope.rolePermissionForm = {};
        $scope.rolePermissionForm.permission_id = [];

        $scope.getRolesList = function () {
            RolesServ.roles().get(function (response) {
                $scope.roleList = ((response.data) ? response.data : []);
                $scope.tableParams = new ngTableParams({
                    page: 1,
                    count: 10
                },
                    {
                        total: $scope.roleList.length,
                        // counts: [],
                        data: $scope.roleList
                    });
            });
        };

        $scope.getRoleByid = function (type) {
            if ($stateParams.id) {
                console.log('$stateParams.id', $stateParams.id);
                $scope.rolePermissionForm = {};
                $scope.rolePermissionForm.permission_id = [];
                RolesServ.roles().get({ id: $stateParams.id }, function (response) {
                    if (response.code === 200) {
                        $scope.roleForm.title = response.data.title;
                        if (type === 'permission') {
                            $scope.rolePermissionForm.permission_id = response.data.permission_id;
                        } else {
                            $scope.roleForm.description = response.data.description;
                        }
                        logger.logSuccess(response.message);
                    } else {
                        logger.logError(response.message);
                        $location.path('roles');
                    }
                });
            }
        };

        $scope.update = function () {
            if ($scope.form.$valid) {
                $scope.disableUpdateSbmtBtn = true;
                RolesServ.roles().update({ id: $stateParams.id }, $scope.roleForm, function (response) {
                    $scope.disableUpdateSbmtBtn = false;
                    if (response.code === 200) {
                        $location.path('roles');
                        logger.logSuccess(response.message);
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        };

        $scope.updatePermission = function () {
            if ($scope.form.$valid) {
                var params = {};
                params.permission_id = [];
                angular.forEach($scope.rolePermissionForm.permission_id, function (value, key) {
                    if (value != null && value != undefined && value != '') {
                        params.permission_id.push(value);
                    }
                });
                if (params.permission_id.length > 0) {
                    $scope.disableUpdateSbmtBtn = true;
                    RolesServ.rolePermissions().update({ id: $stateParams.id }, params, function (response) {
                        $scope.disableUpdateSbmtBtn = false;
                        if (response.code === 200) {
                            $location.path('roles');
                            logger.logSuccess(response.message);
                        } else {
                           // toastr.error(response.message);
                        }
                    });
                } else {
                  //  toastr.info('Please select any permission');
                }
            }
        };

        // --------------- Checkbox Toggle -------------
        // Toogle checkbox selection
        $scope.toggle = function (item, list) {
            var idx = list.indexOf(item);
            if (idx > -1) {
                list.splice(idx, 1);
            } else {
                list.push(item);
            }
        };

        // Check for existing data
        $scope.exists = function (item, list) {
            return list.indexOf(item) > -1;
        };

        //TODO: Delete
        // $scope.delete = function (ev, id) {
        //     var confirm = $mdDialog.confirm()
        //         .title('Delete selected role?')
        //         .content('Are you sure you want to delete selected role?')
        //         .ariaLabel('delete')
        //         .targetEvent(ev)
        //         .theme('content-dark')
        //         .ok('Yes')
        //         .cancel('Cancel');
        //     $mdDialog.show(confirm).then(function () {
        //         RolesServ.roles().delete({ id: id }, function (response) {
        //             if (response.code === 200) {
        //                 logger.logSuccess(response.message);
        //                 $scope.getRolesList();
        //             } else {
        //                 logger.logError(response.message);
        //             }
        //         });
        //     }, function () {
        //     });
        // };

        $scope.add = function () {
            if ($scope.form.$valid) {
                $scope.disableAddSbmtBtn = true;
                RolesServ.roles().save($scope.roleForm, function (response) {
                    $scope.disableAddSbmtBtn = false;
                    if (response.code === 200) {
                        $location.path('roles');
                        logger.logSuccess(response.message);
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        };

        $scope.getPermissions = function () {
            RolesServ.permissions().get(function (response) {
                if (response.code === 200) {
                    $scope.permissionList = response.data;
                }
            });
        };

  
        $scope.checkAll = function () {
            console.log('gfrdg')
            // if (!$scope.selectedAll) {
            //     $scope.selectedAll = true;
            // } else {
            //     $scope.selectedAll = false;
            // }
            angular.forEach($scope.permissionList, function (user) {
                user.select = $scope.selectedAll;
            });
        };
   

    }
]);
