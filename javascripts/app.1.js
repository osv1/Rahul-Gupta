"use strict";

angular.module("Authentication", []);
angular.module("Users", []);
angular.module("Home", []);
angular.module("communicationModule", []);
angular.module("Roles", []);


var MCSIApp = angular.module('MCSIApp', ['ui.router', 'ngRoute', 'ngStorage', 'ngTable', 'ngResource', 'Authentication', 'communicationModule', 'Users', 'Home' , 'ui.bootstrap', 'ui.tinymce'])
    // .constant("APP_CONSTANT", {
    //     API_URL : "";
    // })
   .factory("CommonService", ["$http", "$resource", "$rootScope", function($http, $resource, $rootScope) {

        var user = {};
        var getUser = function() {
            return user;
        };
        var setUser = function(userData) {
            user = '';
            user = userData;
        };
        return {
            getUser: getUser,
            setUser: setUser
        };
    }])
    // .factory('socket', ['$rootScope', function ($rootScope) {
    //     var socket = io.connect();

    //     return {
    //         on: function (eventName, callback) {
    //             socket.on(eventName, callback);
    //         },
    //         emit: function (eventName, data) {
    //             socket.emit(eventName, data);
    //         }
    //     };
    // }])
    .config(['$routeProvider', '$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', function($routeProvider, $httpProvider, $locationProvider, $stateProvider, $urlRouterProvider) {

        $httpProvider.interceptors.push(function($q, $location, $localStorage) {
            return {
                request: function(config) {
                    config.headers = config.headers || {};
                    config.headers['authorization'] = 'bearer ' + $localStorage.token;
                    config.headers['client-type'] = 'browser'; // this is used to detect the request is from the browser
                    return config;
                },
                response: function(response) {
                    if (response.data.code == 401) {
                        delete $localStorage.token;
                        // handle the case where the user is not authenticated
                        $location.path('/home');
                    }
                    return response || $q.when(response);
                }
            };
        });

        var checkLoggedin = function($q, $timeout, $http, $location, $rootScope, $state, CommonService) {
            // Initialize a new promise
            var deferred = $q.defer();
            console.log('----checkLoggedin----');
            // Make an AJAX call to check if the user is logged in
            $http.get('/api/loggedin').success(function (response) {
                // Authenticated
                 console.log('----response----', response);
                var user = response.user;
            
             //   console.log('----user----', user);
                if (response.status == 'OK') {
                    // this will set the user in the session to the application model
                    CommonService.setUser(user);
                    $state.go('dashboard');
                    // $rootScope.logingRole = user.UserType;
                    // //  $state.go('dashboard');
                    // switch (user.UserType) {
                    //     case "SuperAdmin":
                    //         $timeout(deferred.resolve, 0);
                    //         $state.go('users');
                    //       //  $state.go('dashboard');
                    //         break;
                    //     case "Nurse":
                    //         $timeout(deferred.resolve, 0);
                    //             $state.go('users');
                    //         break;
                    //     default:
                    // }
                }
                // // Not Authenticated
                else {
                    $timeout(function () {
                        deferred.resolve();
                    }, 0);
                }
            }).error(function (error) {
                $timeout(function () {
                    deferred.resolve();
                }, 0);
            });
            return deferred.promise;
        };

        var checkLoggedout = function() {
            return ['$q', '$timeout', '$http', '$location', '$rootScope', '$state', 'CommonService',
                function($q, $timeout, $http, $location, $rootScope, $state, CommonService) {
                    // Initialize a new promise

                    var deferred = $q.defer();
                    // Make an AJAX call to check if the user is logged in
                    $http.get('/api/loggedin').success(function(response) {
                        // Authenticated
                        if (response.status == 'OK') {
                            var user = response.user;
                            CommonService.setUser(user);
                            $timeout(deferred.resolve, 0);
                        }
                        // Not Authenticated
                        else {
                            $timeout(function() {
                                deferred.resolve();
                            }, 0);
                            $state.go('dashboard');
                        }
                    }).error(function(error) {
                        $timeout(function() {
                            deferred.resolve();
                        }, 0);
                        $state.go('dashboard');
                    });
                    return deferred.promise;
                }
            ];
        };

        $urlRouterProvider.otherwise('/dashboard');
        $stateProvider
        // // HOME STATES AND NESTED VIEWS ========================================
        // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
            .state('login', {
                url: '/login',
                views: {
                    'content': {
                        templateUrl: '/modules/authentication/views/login.html',
                        controller: "loginController"
                    }
                },
                data: {
                    isAuthenticate: false
                },
                resolve: {
                   // loggedin: checkLoggedin,
                    // loadPlugin: function($ocLazyLoad) {
                    //     return $ocLazyLoad.load([
                    //         '/admin/modules/auth/controllers/loginController.js',
                    //         '/admin/modules/auth/services/authService.js'
                    //     ]);
                    // }
                }
            })
            .state('verifying_link', {
                url: '/verifying-link',
                views: {
                    'content': {
                        templateUrl: '/modules/home/views/verifying_link.html',
                        controller: "homeController"
                    }
                },
                data: {},
                resolve: {}
            })
            .state('forgot_password', {
                url: '/forgot-password',
                views: {
                    'content': {
                        templateUrl: '/modules/authentication/views/forgot-password.html',
                        controller: "loginController"
                    }
                },
                data: {},
                resolve: {
                  //  loggedin: checkLoggedin,
                }
            })
            .state('terms&condition', {
                url: '/terms-and-condition',
                views: {
                    'content': {
                        templateUrl: '/modules/home/views/terms-and-condition.html',
                        controller: "homeController"
                    }
                },
                data: {},
                resolve: {
                    // loggedin: checkLoggedin,
                }
            })
            .state('privacy', {
                url: '/privacy',
                views: {
                    'content': {
                        templateUrl: '/modules/home/views/privacy.html',
                        controller: "homeController"
                    }
                },
                data: {},
                resolve: {
                    // loggedin: checkLoggedin,
                }
            })                        
            .state('dashboard', {
                url: '/dashboard',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/home/views/home.html',
                        controller: "homeController"
                    }
                },
                data: {
                //    isAuthenticate: true
                },
                resolve: {
                 //   loggedin: checkLoggedout()
                }
            })
            .state('users', {
                url: '/users',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/listuser.html',
                        controller: "userController"
                    }
                },
                data: {
               //     isAuthenticate: true
                },
                resolve: {
                //    loggedin: checkLoggedout()
                }
            })
            .state('users_add', {
                url: '/users/add',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/adduser.html',
                        controller: "userController"
                    }
                },
                data: {
                //    isAuthenticate: true
                },
                resolve: {
                 //   loggedin: checkLoggedout()
                }
            })
            .state('users_edit', {
                url: '/user-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/adduser.html',
                        controller: "userController"
                    }
                },
                data: {
                  //  isAuthenticate: true
                },
                resolve: {
                  /////  loggedin: checkLoggedout()
                }
            });
        //to remove the # from the URL
        //$locationProvider.html5Mode({enabled : true, requireBase : false});
    }])

.run(['$rootScope', '$location', '$http', '$localStorage', '$state', 'ngTableParamsService',
    function ($rootScope, $location, $http, $localStorage, $state, ngTableParamsService) {

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
             console.log('stateChangeStart');
            if (fromState.name != 'worker') {
                ngTableParamsService.set('', '', '', '', '');
            }
            if (toState.data) {
                if (!$localStorage.token && toState.data.isAuthenticate) {
                    event.preventDefault();
                    $state.go('dashboard');
                }
            }

            // if (!toState.resolve) { toState.resolve = {}; }
            // toState.resolve.pauseStateChange = [
            //     '$q',
            //     function ($q) {
            //         var defer = $q.defer();
            //         console.log('in q');
            //         $http.get('/api/getUsersPermission').then(function (response) {
            //              console.log('in getpermission check');
            //                 console.log('----response in statechnagestart-----', response);
            //             if (response.code === 200) {
            //                  console.log('in response code check');
                            
            //                 if (response.data.permissions.indexOf(toState.name) == -1 && toState.name != '') {
            //                     event.preventDefault();
            //                     //$state.go('dashboard');
            //                 }
            //                 defer.resolve();
            //             } else {
            //                 event.preventDefault();
            //                 defer.resolve();
            //             }
            //         });
            //         return defer.promise;
            //     }
            // ];

            /*To check user permissions access level*/
            // $http.get('/api/getUsersPermission').success(function (response) {
            //     console.log('in getpermission check');
            //     console.log('----response getpermission-----', response);
            //     if (response.code === 200) {
            //         console.log('----toState-----', toState.name);
            //         response.data.permissions.push('users');
            //         var result = response.data.permissions.indexOf(toState.name);
            //         console.log('----permissions-----', response.data.permissions);
            //         if (response.data.permissions.indexOf(toState.name) == -1 && toState.name != '') {
            //             console.log('---in internal if-----');
            //             event.preventDefault();
            //             $state.go('dashboard');
            //         }
            //     }
            // });
        });
    }
]).filter('capitalize', function () {
    return function (input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
});







// /*To check user permissions access level*/
//               $http.get('/api/permissions/get_user_permissions').success(function(response) {
//          //   $http.get($SERVICE + '/permissions/get_user_permissions')
//              //   .success(function(response) {
//                     if (response.code === 200) {
//                         // $rootScope.permissionsArray = response.data.permissions;
//                         if (response.data.permissions.indexOf(toState.name) == -1 && toState.name != '') {
//                             // event.preventDefault();
//                             // $state.go('dashboard');
//                         }
//                     }
//             });
