"use strict";

angular.module("Users")

MCSIApp.controller('userController', ['$scope', '$rootScope', '$location','$ocLazyLoad', '$localStorage', '$modal', '$timeout', '$state', 'ngTableParams', 'ngTableParamsService', 'logger', 'UserService', 'Upload', 'CommonService',
    function ($scope, $rootScope, $location,$ocLazyLoad, $localStorage, $modal, $timeout, $state, ngTableParams, ngTableParamsService, logger, UserService, Upload, CommonService) {
        /**
         * Function is use to user  Modules changes are here
         * @access private
         * @return json
         * Created by sunny
         * @smartData Enterprises (I) Ltd
         * Created Date 27-April-2017
         */
        $scope.addUser = function (user) {
            UserService.addUser().save(user, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('users');
                } else {
                    logger.logError(response.message);
                }
            });
        }

        var getData = ngTableParamsService.get();
        $scope.searchTextField = getData.searchText;
        $scope.searching = function () {
            ngTableParamsService.set('', '', $scope.searchTextField, '');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.usersList = [];
                    UserService.getUsersList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.usersList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getUsersList = function () {
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.usersList = [];
                    UserService.getUsersList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.usersList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };


        $scope.getRolesList = function () {
         //   console.log("getRolesList")
            UserService.getRolesList().get(function (response) {

                if (response.code == 200) {
                    $scope.rolesList = response.data;
                    var store = $scope.rolesList;
                } else {
                    logger.logError(response.message);
                }
            })
        }

        $scope.getuserbyId = function (id) {
          //  console.log('Id:', id);
          //  console.log('$state.params.id:', $state.params.id);
            UserService.getuserbyId($state.params.id).get(function (response) {
                // console.log("getuserbyId", response.data);
                if (response.code == 200) {
                    $scope.userid = response.data;
                  //  console.log(response.data);
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }

        //var getFamilyData = ngTableParamsService.get();
        // $scope.searchTextField = getFamilyData.searchText;
        $scope.searching1 = function () {
            ngTableParamsService.set('', '', $scope.searchTextField, '');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.familyDoctors = [];
                    UserService.getFamilyDoctors().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.familyDoctors = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getFamilyDoctors = function () {
         //   console.log('getFamilyDoctors');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.familyDoctors = [];
                    UserService.getFamilyDoctors().get($scope.paramUrl, function (response) {
                    //    console.log("getFamilyDoctors", response.data);
                        $scope.tableLoader = false;
                        $scope.familyDoctors = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };
        // $scope.getFamilyDoctors = function() {
        //         console.log("get docters");
        //         UserService.getFamilyDoctors().get(function(response){
        //             console.log('response',response);
        //             if(response.code == 200){
        //                 $scope.familyDoctors=response.data;
        //                 var store=$scope.familyDoctors;
        //                 console.log('getDoctors',store);
        //             } else{
        //                 alert('no record');
        //             }
        //         }),
        //         function(response){
        //             logger.logError(response.message);
        //             alert('error');
        //         }
        // } 

        $scope.addFamilyDoctor = function (form) {
           // console.log("form", form);
            UserService.addFamilyDoctor().save(form, function (response) {
              //  console.log('response', response);
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('familyDoctors');
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }

        $scope.addDoctor = function (form) {
            UserService.addDoctor().save(form, function (response) {
               // console.log('response', response);
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $scope.getDoctors();
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }

        $scope.getDoctors = function () {
            Userservice.getDoctors().get(function (response) {
             //   console.log('response', response);
                if (response.code == 200) {
                    $scope.getDoctors = response.data;
                }
            }),
                function (respone) {
                    logger.logError(response.message);
                }
        }

        $scope.addStatus = function (status) {
            Userservice.addStatus().save(status, function (response) {
              //  console.log('response', response);
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $scope.getStatus();
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }

        $scope.getStatus = function () {
            UserService.getStatus().get(function (response) {
                if (response.code == 200) {
                   // $scope.getStatus = response.data;
                    $scope.statuslist = response.data;
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }

        $scope.getDoctorbyId = function (id) {
            UserService.getDoctorbyId($stateParams.id).get(function (response) {
              //  console.log(response)
                if (response.code == 200) {
                    $scope.doctorid = response.data;
                }
            }),
                function (response) {
                    logger.logError(response.message);
                }
        }


        $scope.deleteUser = function (id) {
            bootbox.confirm('Are you sure you want to delete this user', function (r) {
                if (r) {
                    UserService.deleteUser().delete({ id: id }, function (response) {
                        if (response.code == 200) {
                            $scope.getUsersList();
                            logger.logSuccess(response.message);
                        } else {
                            logger.logError(response.message);
                        }
                    });
                }
            })
        }

        $scope.deleteFamilyDoctor = function (id) {
            bootbox.confirm('Are you sure you want to delete this family doctor', function (r) {
                if (r) {
                    UserService.deleteUser().delete({ id: id }, function (response) {
                        if (response.code == 200) {
                            $scope.getFamilyDoctors();
                            response.message = "Family Doctor deleted successfully";
                            logger.logSuccess(response.message);
                        } else {
                            logger.logError(response.message);
                        }
                    });
                }
            });
        };

        $scope.enableDisableUser = function (id, status) {
            UserService.enableDisableUser().save({ userId: id, status: status }, function (response) {
                if (response.code == 200) {
                    $scope.getUsersList();
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            });
        };


        $scope.getUserByToken = function () {
          //  console.log('Before $scope.UserProfile:', $scope.UserProfile);
            UserService.getUserByToken().get(function (response) {
                if (response.code == 200) {
                    $scope.UserProfile = response.data;
                  //  console.log('$scope.UserProfile:', $scope.UserProfile);
                    logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            })
        };
        $scope.uploadImage = function (dataUrl, name) {
            
                Upload.upload({
                url: baseUrl+'/api/uploadImage',
                data: {
                    file: Upload.dataUrltoBlob(dataUrl, name)
                },
            }).then(function (resp) {
                $timeout(function () {
                    $scope.result = resp.data;
                }); 
                $scope.getUserByToken();
                if (resp.data && resp.data.data) {
                    $localStorage.profileName = resp.data.data;
                    $rootScope.profileName = resp.data.data;
                }
                logger.logSuccess(resp.data.message);
            }, function (resp) {
                logger.logError(resp.data.message);
            }, function (evt) {
                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
            });
        }
       

        $scope.colorStatusbyId = function (id) {
            UserService.colorStatusbyId($state.params.id).get(function (response) {
                if (response.code == 200) {
                    $scope.status = response.data;
                } else {
                    logger.logError(response.message);
                }
            }),
                function (response) {
                    logger.logError(response.message);

                }
        }

        $scope.updateColorStatus = function (status, id) {
            UserService.updateColorStatus().save(status, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                    $state.go('statuses');

                } else {
                    logger.logError(response.message);
                }
            });
        }





        //   $scope.uploadImage = function (file) {
        //     Upload.upload({
        //         url: 'http://52.39.212.226:5054/api/uploadImage',
        //         data: {file: file}
        //     }).then(function (resp) {
        //         $scope.getUserByToken();
        //          if(resp.data && resp.data.data){
        //             $localStorage.profileName = resp.data.data;
        //             $rootScope.profileName = resp.data.data;
        //         }
        //         logger.logSuccess(resp.data.message);
        //     }, function (resp) {
        //         logger.logError(resp.data.message);
        //     }, function (evt) {
        //         var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);         
        //     });
        // }

        $scope.getkupatCholim = function () {
            UserService.getkupatCholim().get(function (response) {
                if (response.code == 200) {
                    $scope.kupatCholimlist = response.data;
                } else {
                    logger.logError(response.message);
                }
            });
        };


        $scope.items = ["item1", "item"];
        $scope.openDilogue = function (a, id) {
          //  console.log(id, a);
            var modalInstance;
            modalInstance = $modal.open({
                templateUrl: '/modules/users/views/' + a + '.html',
                controller: "ModalCtrl",
                resolve: {
                    items: function () {
                        return {
                            id: id
                        }
                    }
                }
            })
        }

         //Update EMC ip
         $scope.addOrUpdateIp = function () {
            if ($scope.form.$valid) {
                UserService.addOrUpdateIp().save($scope.settings, function (response) {
                    console.log('Respone:', response);
                    if (response.code === 200) {
                      //  $location.path('roles');
                        logger.logSuccess(response.message);
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        };

          //Get Setting Data
         $scope.getSettingsData = function () {
            $scope.settings = {};
            UserService.getSettingsData().get(function (response) {
                if (response.code == 200) {        
                    $scope.settings = response.data.data;
                    console.log("$scope.settings", $scope.settings);
                } else {
                    logger.logError(response.message);
                }
            });
        };

        
   
         $scope.changePasswordFirstLogin = function (newPassword, confirmPassword) {
             console.log("changePassword---->", $location.search().i);
              console.log("newPassword---->", newPassword);
               console.log("confirmPassword---->", confirmPassword);
             if (newPassword == confirmPassword) {
                 var data = {
                     id: $location.search().i,
                     password: newPassword
                 }
                 UserService.resetPassword().save(data, function (response) {
                     console.log("response changePassword---->", response);
                     if (response.code == 200) {
                         logger.logSuccess(response.message);
                         $state.go('dashboard');
                     } else {
                         logger.logError(response.message);
                     }
                 });
             } else {
                 logger.logError("Confirm Password Incorrect");
             }
         };
        
         $scope.updateProfile = function(UserProfile) {
           UserService.updateProfile().save(UserProfile, function(response) {
                if (response.code == 200) {
                logger.logSuccess(response.message);
                $state.go('myprofile'); 

             } else {
                logger.logError(response.message);
                        }
                    });
                }

    }]);

MCSIApp.controller('ModalCtrl', ['$scope', '$rootScope', '$location', '$modalInstance', '$localStorage', '$modal', 'ngTableParams', 'ngTableParamsService', '$state', 'logger', 'UserService', 'Upload', 'CommonService',
    function ($scope, $rootScope, $location, $modalInstance, $localStorage, $modal, ngTableParams, ngTableParamsService, $state, logger, UserService, Upload, CommonService) {

        $scope.hide = true;


        $scope.getUserByToken = function () {
            UserService.getUserByToken().get(function (response) {
                if (response.code == 200) {
                    $scope.UserProfile = response.data;
                    // logger.logSuccess(response.message);
                } else {
                    logger.logError(response.message);
                }
            })
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $(document).ready(function () {
            $(".fancybox").fancybox();
        });

        $scope.resetPassword = function (UserProfile, newPassword, confirmPassword, oldPassword, password) {
            if (oldPassword == password) {
                if (newPassword == confirmPassword) {
                    UserProfile.password = newPassword;
                    UserService.resetPassword().save(UserProfile, function (response) {
                        if (response.code == 200) {
                            logger.logSuccess(response.message);
                            $scope.cancel();
                        } else {
                            logger.logError(response.message);
                        }
                    });
                } else {
                    logger.logError("Confirm Password Incorrect");
                }
            } else {
                logger.logError("Old Password Incorrect");
            }
        }

    }]);