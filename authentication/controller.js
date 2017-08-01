"use strict";


angular.module("Authentication");

MCSIApp.controller('loginController', ['$scope', '$rootScope', '$location', '$ocLazyLoad', 'AuthenticationService', '$localStorage', 'logger', 'CommonService', 'socket', '$window',
    function ($scope, $rootScope, $location, $ocLazyLoad, AuthenticationService, $localStorage, logger, CommonService, socket, $window) {

        var inputJSON = "";
        $scope.user = {};
        $scope.forgotPass = {};
        $scope.isPasswordSent = false;
        $scope.disabled = false;
        $scope.loader = false;

        $scope.login = function (form) {
            if (form.$valid) {
                $scope.disabled = true;
                $scope.loader = true;
                AuthenticationService.Login($scope.user, function (response) {
                    // console.log('-----login controller-----', $scope.user);
                    // console.log('-----response login-----', response);
                    var errorMessage = '';
                    $scope.disabled = false;
                    $scope.loader = false;

                    if (response.code == 200) {
                        socket.emit('join');
                        $localStorage.userLoggedIn = true;

                        if (response.data) {
                            $window.sessionStorage.setItem('token', response.data.token);
                            $window.sessionStorage.setItem('userId', response.data._id);
                            $localStorage.loggedInUser = response.data.full;
                            $localStorage.profileName = response.data.profileName;
                        }
                        socket.emit('join', $window.sessionStorage.userId);
                        CommonService.setUser(response.data);
                        console.log('-----user role-----', response.data.role_id.name);
                        if (response.data.role_id && response.data.role_id.name) {
                            if (response.data.role_id.name == 'nurse') {
                                $location.path('/activePatient');
                                $window.sessionStorage.setItem('role', response.data.role_id.name);
                            }
                            else if (response.data.role_id.name == 'doctor') {
                                $location.path('/activePatientByDr');
                                $window.sessionStorage.setItem('role', response.data.role_id.name);
                            }
                            else {
                                $location.path('/dashboard');
                            }
                        }
                        else {
                            $location.path('/dashboard');
                        }
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        };

        //logout
        $scope.logout = function () {
            AuthenticationService.logout($scope.user, function (response) {
                console.log('-----login controller logout----->', $scope.user);
                if (response.code == 200) {
                    socket.emit('leave');
                    $window.sessionStorage.setItem('token', '');
                    $window.sessionStorage.setItem('userId', '');
                    delete $localStorage.loggedInUser;
                    delete $localStorage.profileName;
                    delete $localStorage.lang;
                    delete $localStorage.css;
                    $rootScope.userLoggedIn = false;
                    logger.logSuccess(response.message);
                    $location.path('/signIn');
                } else {
                    logger.logError(response.message);
                }
            });
        };


        //forgot password
        // $scope.resendPassword = function(form) {
        //     if (form.$valid) {
        //         $scope.disabled = true;
        //         $scope.loader = true;
        //         $scope.forgotPass.isAdmin = true;
        //         AuthenticationService.resendPassword($scope.forgotPass, function(response) {
        //             $scope.disabled = false;
        //             $scope.loader = false;
        //             if (response.code == 200) {
        //                 $scope.isPasswordSent = true;
        //                 logger.logSuccess(response.message);
        //             } else {
        //                 logger.logError(response.message);
        //             }
        //         });
        //     }
        // }

        $scope.resendPassword = function (form) {
            if (form.$valid) {
                $scope.disabled = true;
                $scope.loader = true;
                AuthenticationService.resendPassword($scope.forgotPass, function (response) {
                    $scope.disabled = false;
                    $scope.loader = false;
                    if (response.code == 200) {
                        $scope.isPasswordSent = true;
                        logger.logSuccess(response.message);
                    } else {
                        logger.logError(response.message);
                    }
                });
            }
        }
    }]);
