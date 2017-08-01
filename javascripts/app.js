"use strict";

angular.module("Authentication", []);
angular.module("Users", []);
angular.module("Home", []);
angular.module("communicationModule", []);
angular.module("Roles", []);
angular.module("Disease", []);
angular.module("Survey", []);
angular.module("Patients", []);
angular.module("Inventory", []);
angular.module("Kupat", []);
angular.module("Reports", []);


var MCSIApp = angular.module('MCSIApp',
    [
        'ui.router',
        'ui.bootstrap',
        'oc.lazyLoad',
        'ngRoute',
        'ngStorage',
        'ngTable',
        'ngResource',
        'Authentication',
        'communicationModule',
        'Users',
        'Home',
        'Disease',
        'Survey',
        'Kupat',
        'Patients',
        'Inventory',
        'Roles',
        'Reports',
        'ui.bootstrap',
        'ui.tinymce',
        'angularUtils.directives.dirPagination',
        // 'mgcrea.ngStrap',
        'isteven-multi-select',
        'ngTagsInput',
        'angucomplete-alt',
        'pascalprecht.translate',
        'ngFileUpload',
        'ngImgCrop',
        'ui.grid',
        'ui.grid.selection',
        'ui.grid.exporter',
        'ui.grid.moveColumns',
        'ui.grid.pagination',
        'colorpicker.module',
        'cfp.hotkeys',
        'angular-web-notification',
    ])

    .factory("CommonService", ["$http", "$resource", "$rootScope", function ($http, $resource, $rootScope) {

        var user = {};
        var getUser = function () {
            return user;
        };
        var setUser = function (userData) {
            user = '';
            user = userData;
        };
        return {
            getUser: getUser,
            setUser: setUser
        };
    }])

    .factory('socket', function ($rootScope, $window) {
        var socket = io.connect('http://52.39.212.226:5054');

        socket.on('connect', function () {
            // alert("Connected");
            var id = socket.io.engine.id;
            // alert(id);
            console.log("id------>", id);
            console.log("$window.sessionStorage.userId------>", $window.sessionStorage.userId);
            if ($window.sessionStorage.userId !== undefined) {
                socket.emit('join', $window.sessionStorage.userId);
            }
        });

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    })

    .config(['$routeProvider', '$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider', '$windowProvider', function ($routeProvider, $httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $translateProvider, $windowProvider) {
        var $window = $windowProvider.$get();
        $httpProvider.interceptors.push(function ($q, $location, $localStorage, $window) {
            return {
                request: function (config) {
                    config.headers = config.headers || {};
                    var token = $window.sessionStorage.getItem("token");
                    //console.log("----token in session------", token);
                    // config.headers['authorization'] = 'bearer ' + $localStorage.token;
                    config.headers['authorization'] = 'bearer ' + token;
                    config.headers['client-type'] = 'browser'; // this is used to detect the request is from the browser
                    return config;
                },
                response: function (response) {
                    //console.log("----response---------", response);
                    if (response.data.code == 401) {
                        //delete $localStorage.token;
                        $window.sessionStorage.setItem('token', '');
                        // console.log("---1----", $location.path());
                        //   console.log("---chk---->", ($location.path()).indexOf("/showSurvey") < 0);
                        // handle the case where the user is not authenticated
                        if (($location.path()).indexOf("/showSurvey") < 0) {
                            if ($location.path() != '/changePassword') {
                                // console.log("Inner if");
                                $location.path('/signIn');
                            }
                        }
                    }
                    return response || $q.when(response);
                }
            };
        });

        var checkLoggedin = function ($q, $timeout, $http, $location, $rootScope, $state, CommonService) {
            // Initialize a new promise
            var deferred = $q.defer();
            console.log('----checkLoggedin----');
            // Make an AJAX call to check if the user is logged in
            $http.get('/api/loggedin').success(function (response) {
                // Authenticated
                console.log('----response----', response);
                var user = response.user;

                if (response.status == 'OK') {
                    // this will set the user in the session to the application model
                    CommonService.setUser(user);

                    $state.go('dashboard');
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

        var checkLoggedout = function () {
            return ['$q', '$timeout', '$http', '$location', '$rootScope', '$state', 'CommonService',
                function ($q, $timeout, $http, $location, $rootScope, $state, CommonService) {
                    // Initialize a new promise


                    var deferred = $q.defer();
                    // Make an AJAX call to check if the user is logged in
                    $http.get('/api/loggedin').success(function (response) {
                        // Authenticated
                        if (response.status == 'OK') {
                            var user = response.user;
                            CommonService.setUser(user);
                            $timeout(deferred.resolve, 0);
                        }
                        // Not Authenticated
                        else {
                            $timeout(function () {
                                deferred.resolve();
                            }, 0);
                            $rootScope.isSpecificPage = true;
                            console.log('----2-----');
                            $state.go('signIn');
                        }
                    }).error(function (error) {
                        $timeout(function () {
                            deferred.resolve();
                        }, 0);
                        $rootScope.isSpecificPage = true;
                        console.log('----3-----');
                        $state.go('signIn');
                    });
                    return deferred.promise;
                }
            ];
        };

        $translateProvider.preferredLanguage('en');

        $translateProvider.fallbackLanguage('hw');

        $translateProvider.useStaticFilesLoader({
            prefix: 'lang_', //relative path Eg: /assets/languages/
            suffix: '.json' //file extension
        });


        $urlRouterProvider.otherwise('/dashboard');
        $stateProvider
            // // HOME STATES AND NESTED VIEWS ========================================
            // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
            .state('signIn', {
                url: '/signIn',
                views: {
                    'content': {
                        templateUrl: '/modules/authentication/views/signin.html',
                        controller: "loginController"
                    }
                },
                data: {
                    isAuthenticate: false
                },
                resolve: {
                    loggedin: checkLoggedin,
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/authentication/controller.js',
                            '/modules/authentication/service.js'
                        ]);
                    }
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
                data: {

                },
                resolve: {
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/home/controller.js',
                            '/modules/home/homeService.js'
                        ]);
                    }
                }
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
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/authentication/controller.js',
                            '/modules/authentication/service.js'
                        ]);
                    }
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
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/home/controller.js',
                            '/modules/home/homeService.js'
                        ]);
                    }
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
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/home/controller.js',
                            '/modules/home/homeService.js'
                        ]);
                    }
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
                        templateUrl: '/modules/home/views/dashboard.html',
                        controller: "homeController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/home/controller.js',
                            '/modules/home/homeService.js'
                        ]);
                    }
                }
            })
            // by sunny on 27/april/2017 
            .state('familyDoctors', {
                url: '/dashboard/familyDoctors',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/FamilyDoc_list.html',
                        controller: 'userController'
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })
            .state('add_family_Doctors', {
                url: '/dashboard/add_family_Doctors/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/add_family_doctors.html',
                        controller: "userController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }

            })
            .state('users', {
                url: '/dashboard/userlist',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/add_user_list.html',
                        controller: 'userController'
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })
            .state('addUser', {
                url: '/dashboard/userlist/adduser/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/add_user.html',
                        controller: 'userController'
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
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
                        templateUrl: '/modules/users/views/add_user.html',
                        controller: "userController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })
            // End 
            .state('myprofile', {
                url: '/myprofile',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/profileD.html',
                        controller: 'userController'
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })

            //Swapnali
            .state('index_add', {
                url: '/dashboard/addIndex',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/addIndex.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })

            .state('index', {
                url: '/dashboard/indexList',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/indexlist.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })
            .state('add_disease', {
                url: '/dashboard/add_disease',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'

                    },
                    'content': {
                        templateUrl: '/modules/disease/views/add_disease.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }

            })
            .state('Diseases', {
                url: '/dashboard/Currentdisease',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/disease_list.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }

            })
            .state('Test', {
                url: '/dashboard/test/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'footer': {
                        //   templateUrl: '/modules/home/views/footer.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/test.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })
            //survey section
            .state('survey', {
                url: '/dashboard/survey',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/survey/views/addSurvey.html',
                        controller: "surveyController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/survey/controller.js',
                            '/modules/survey/service.js'
                        ]);
                    }
                }
            })
            //Patient section
            .state('patientdashboard', {
                url: '/patientdashboard',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientDashboard.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('activePatient', {
                url: '/activePatient',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/activePatientList.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('patientList', {
                url: '/patientList',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientList.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('addPatient', {
                url: '/addPatient/:id/:showTopNav',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/addPatient.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            //index section
            .state('addIndexTriage', {
                url: '/dashboard/indexList/addIndexTriage',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/add_index_triage.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })
            .state('addIndexDisease', {
                url: '/dashboard/indexList/addIndexDisease',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/add_index_disease.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })

            //by sunny on 29/april/2017
            .state('edit_disease', {
                url: '/indexList/editdisease/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/edit_disease.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })
            .state('edit_triage', {
                url: '/indexList/edittriage/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/disease/views/edit_triage.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }
            })
            .state('updatetest', {

                url: '/dashboard/updatetest/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    // 'footer': {
                    //     templateUrl: '/modules/home/views/footer.html'
                    // },
                    'content': {
                        templateUrl: '/modules/disease/views/updatetest.html',
                        controller: "diseaseController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/disease/controller.js',
                            '/modules/disease/service.js'
                        ]);
                    }
                }

            })
            //roles and permission section
            .state('roles', {
                url: '/roles',
                title: 'Role Listing',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/roles/views/index.html',
                        controller: "roleController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/roles/controller.js',
                            '/modules/roles/service.js'
                        ]);
                    }
                }
            })
            .state('addRole', {
                url: '/role/add',
                title: 'Add Roles',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/roles/views/create.html',
                        controller: "roleController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/roles/controller.js',
                            '/modules/roles/service.js'
                        ]);
                    }
                }
            })
            .state('editRoles', {
                url: '/roles/edit/:id',
                title: 'Edit Role',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/roles/views/edit.html',
                        controller: "roleController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/roles/controller.js',
                            '/modules/roles/service.js'
                        ]);
                    }
                }
            })
            .state('rolePermissions', {
                url: '/roles/permissions/:id',
                title: 'Add Role',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/roles/views/permissions.html',
                        controller: "roleController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/roles/controller.js',
                            '/modules/roles/service.js'
                        ]);
                    }
                }
            })
            //2nd May 2017 // visit region
            .state('addVisitReason', {
                url: '/visitReason/add',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/addVisitReason.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('addNewVisitReason', {
                url: '/addNewVisitReason/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/addNewVisitReason.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('editVisitReason', {
                url: '/visitReason-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/addVisitReason.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('editPatientIdentification', {
                url: '/patientIdentification-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/editPatient.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('editPayment', {
                url: '/payment-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/payment.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('editTriage', {
                url: '/triage-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/triage.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('editNurseExam', {
                url: '/nurseExam-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/nurseExam.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('visitDetails', {
                url: '/visitDetails-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/visit_details.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            //doctor region
            .state('editDoctorExam', {
                url: '/doctorExam-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorExam.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('doctorSummary', {
                url: '/doctorSummary/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorSummary.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('doctorResult', {
                url: '/doctorResult-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorResult.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })

            //by sunny on 12april2017
            .state('doctorResultFollowUp', {
                url: '/doctorResultFollowUp-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorResultFollowUp.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            //End on 12april2017
            .state('doctorPrescription', {
                url: '/prescription-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorPrescription.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('visitCard', {
                url: '/visitCard/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/visitCard.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('newVisitCard', {
                url: '/newVisitCard/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/newVisitCard.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('prescription', {
                url: '/prescription',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/prescription.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('result', {
                url: '/result',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/result_screen.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            //by sunny on 15-april-2017
            .state('inventoryList', {
                url: '/inventoryList',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/inventory/views/inventory_list.html',
                        controller: "inventoryController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/inventory/controller.js',
                            '/modules/inventory/service.js'
                        ]);
                    }
                }
            })

            .state('addDrug', {
                url: '/addDrug',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/inventory/views/addDrug.html',
                        controller: "inventoryController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/inventory/controller.js',
                            '/modules/inventory/service.js'
                        ]);
                    }

                }
            })
            //CLOSURE REGION
            .state('summary', {
                url: '/summary-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/summary.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            //-----------------visit docuemnt ----------------------
            .state('visitDocument', {
                url: '/visitDocument/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/visitDocument.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })

            .state('addkupatCholim', {
                url: '/dashboard/kupatCholim_list/addkupatCholim',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/kupatCholim/views/addkupatCholim.html',
                        controller: "kupatCholimController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/kupatCholim/controller.js',
                            '/modules/kupatCholim/service.js'
                        ]);
                    }
                }
            })

            .state('editKupatCholim', {
                url: '/dashboard/kupatCholim_list/editKupatCholim/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/kupatCholim/views/editkupatCholim.html',
                        controller: "kupatCholimController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/kupatCholim/controller.js',
                            '/modules/kupatCholim/service.js'
                        ]);
                    }
                }
            })

            .state('kupatCholim_list', {
                url: '/dashboard/kupatCholim_list',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/kupatCholim/views/kupatCholim_list.html',
                        controller: 'kupatCholimController'
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/kupatCholim/controller.js',
                            '/modules/kupatCholim/service.js'
                        ]);
                    }
                }
            })

            .state('patientVisitHistory', {
                url: '/patientVisitHistory/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientVisitHistoryList.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })

            .state('visitHistory', {
                url: '/visitHistory',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/visitHistoryList.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }

                }
            })
            .state('patientDrugListing', {
                url: '/patientDrugListing/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientDrugListing.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('patientSummary', {
                url: '/patientSummary/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientSummary.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('visitcomment', {
                url: '/visitcomment/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/comment.html',
                        controller: "patientController"
                    }
                },
            })
            //-----------------REPORT SECTION ----------------------
            .state('reportDashboard', {
                url: '/reportDashboard',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/reportDashboard.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('visitorsResultReport', {
                url: '/visitResultReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/visitResult_report.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('visitResultHistoryReport', {
                url: '/visitResultHistoryReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/visitResult_history.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('currentDiseaseReport', {
                url: '/currentDiseaseReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/currentDisease_report.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('currentDiseaseHistoryReport', {
                url: '/currentDiseaseHistoryReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/currentDisease_history.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('invChangeReport', {
                url: '/invChangeReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/invChange_report.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('invChangeHistoryReport', {
                url: '/invChangeHistoryReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/invChange_history.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('drugsGiveAwayReport', {
                url: '/drugsGiveAwayReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/drugsGiveAway_report.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('drugsGiveAwayHistoryReport', {
                url: '/drugsGiveAwayHistoryReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/drugsGiveAway_history.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('kupatCholimReport', {
                url: '/kupatCholimReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/kupatCholim_report.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })
            .state('kupatCholimHistoryReport', {
                url: '/kupatCholimHistoryReport',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/reports/views/kupatCholim_history.html',
                        controller: "reportController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/reports/controller.js',
                            '/modules/reports/service.js'
                        ]);
                    }
                }
            })

            .state('status_edit', {
                url: '/status_edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/status_edit.html',
                        controller: "userController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })
            .state('statuses', {
                url: '/dashboard/statuses',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/status-list.html',
                        controller: 'userController'
                    }
                },

                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                }
            })
            .state('patientDebt', {
                url: '/patientDebt',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/patientDebtList.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('showSurvey', {
                url: '/showSurvey/:id',
                views: {
                    'content': {
                        templateUrl: '/modules/survey/views/emc_questionaire.html',
                        controller: "surveyController"
                    }
                },
            })
            .state('ipSettings', {
                url: '/dashboard/ipSettings',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/users/views/ipSettings.html',
                        controller: "userController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }

                }
            })

            .state('doctorOrder', {
                url: '/doctorOrder/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorOrder.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }

                }
            })

            .state('doctorTreatment', {
                url: '/doctorTreatment-edit/:id',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/doctorTreatment.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout(),
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/patient/controller.js',
                            '/modules/patient/service.js'
                        ]);
                    }
                }
            })
            .state('changePassword', {
                url: '/changePassword',
                views: {
                    'content': {
                        templateUrl: '/modules/users/views/changepassword.html',
                        controller: "userController"
                    }
                },
                data: {
                    //  isAuthenticate: false
                },
                resolve: {
                    loadPlugin: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            '/modules/users/controller.js',
                            '/modules/users/service.js'
                        ]);
                    }
                    //   loggedin: checkLoggedin,
                    // loadPlugin: function($ocLazyLoad) {
                    //     return $ocLazyLoad.load([
                    //         '/modules/authentication/controller.js',
                    //         '/modules/authentication/services.js'
                    //     ]);
                    // }
                }
            })
            .state('activePatientByDr', {
                url: '/activePatientByDr',
                views: {
                    'header': {
                        templateUrl: '/modules/home/views/header.html'
                    },
                    'leftBar': {
                        templateUrl: '/modules/home/views/leftBar.html'
                    },
                    'content': {
                        templateUrl: '/modules/patient/views/activePatientListByDr.html',
                        controller: "patientController"
                    }
                },
                data: {
                    isAuthenticate: true
                },
                resolve: {
                    loggedin: checkLoggedout()
                }
            })
        //to remove the # from the URL
        // $locationProvider.html5Mode({enabled : true, requireBase : false});
        // $locationProvider.html5Mode(true).hashPrefix('!');
    }])

    .run(['$rootScope', '$location', '$http', '$localStorage', '$state', '$translate', 'ngTableParamsService', '$window',
        function ($rootScope, $location, $http, $localStorage, $state, $translate, ngTableParamsService, $window) {

            if ($localStorage.lang && $localStorage.lang == 'hw') {
				$rootScope.toastBase = 'toast-top-left';
			}
			else {
				$rootScope.toastBase = 'toast-top-right';
			}

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
                $rootScope.currentState = toState.name;
                $rootScope.$emit('start', true);
                console.log('stateChangeStart', toState.url);
                var isCssUnDefined = angular.isUndefined($localStorage.css);
                console.log("isCssUnDefined: ", isCssUnDefined);
                if (isCssUnDefined == true) {
                    $rootScope.css = 'main';
                    $translate.use('en');
                }
                else {
                    $rootScope.css = $localStorage.css;
                }
                console.log("$localStorage.lang: ", $localStorage.lang);
                $translate.use($localStorage.lang);
                console.log('$rootScope.css: ', $rootScope.css);
                var pages = ["/signIn", "/forgot-password", "/changePassword"];
                console.log('$location.path()', $location.path());
                $rootScope.isSpecificPage = pages.indexOf(toState.url) > -1;
                if (($location.path()).match("/showSurvey")) {
                    $rootScope.isSpecificPage = true;
                    console.log("ShowSurveycheck: ", $rootScope.isSpecificPage);
                }
                console.log('$rootScope.isSpecificPage', $rootScope.isSpecificPage);
                $rootScope.loggedInUser = $localStorage.loggedInUser;
                $rootScope.profileName = $localStorage.profileName;

                // Make an AJAX call to check if the user is logged in
                if (fromState.name != 'worker') {
                    ngTableParamsService.set('', '', '', '', '');
                }
                var pagesNotNeedAuthentication = ["/showSurvey", "/changePassword", "/forgot-password"];
                // if (($location.path()).indexOf("/showSurvey") < 0 || ($location.path()).indexOf("/changePassword")) {
                if (pagesNotNeedAuthentication.indexOf(toState.url) < 0) {
                    if (toState.data) {
                        console.log('stateChangeStart toState.data.isAuthenticate', toState.data.isAuthenticate);
                        //  if (!$localStorage.token && toState.data.isAuthenticate) {
                        if (!$window.sessionStorage.token && toState.data.isAuthenticate) {
                            console.log('chk');
                            $location.path('/signIn');
                        }
                        else {
                            if (!toState.resolve) { toState.resolve = {}; }
                            toState.resolve.pauseStateChange = [
                                '$q',
                                function ($q) {
                                    var defer = $q.defer();
                                    $http.get('/api/getUsersPermission').then(function (response) {
                                        console.log('----statechnagestart getUsersPermission-----', response.data);
                                        if (response.data.data && response.data.code === 200) {
                                            console.log('in response code check');
                                            $rootScope.permissionsArray = response.data.data.permissions;
                                            console.log("permissionsArray: ", $rootScope.permissionsArray);
                                            if (response.data.data.permissions && response.data.data.permissions.indexOf(toState.name) == -1 && toState.name != '') {
                                                // console.log("In internal if");
                                                // event.preventDefault();
                                                //$state.go("notAuthorizedPage");
                                                if (toState.name == 'patientdashboard') {
                                                    if ($window.sessionStorage.role == 'nurse') {
                                                        if (fromState.name !== 'activePatient') {
                                                            $state.go('activePatient');
                                                        }
                                                        else {
                                                            defer.reject();
                                                        }
                                                    }
                                                    else if ($window.sessionStorage.role == 'doctor') {
                                                        if (fromState.name !== 'activePatientByDr') {
                                                            $state.go('activePatientByDr');
                                                        }
                                                        else {
                                                            defer.reject();
                                                        }
                                                    }
                                                    else if ($window.sessionStorage.role !== 'admin' || $window.sessionStorage.role !== 'superAdmin') {
                                                        if (fromState.name !== 'activePatient') {
                                                            $state.go('activePatient');
                                                        }
                                                        else {
                                                            defer.reject();
                                                        }
                                                    }
                                                    else {
                                                        event.preventDefault();
                                                    }
                                                }
                                                else {
                                                    event.preventDefault();
                                                }
                                            }
                                            defer.resolve();
                                        } else {
                                            event.preventDefault();
                                            defer.resolve();
                                        }
                                    });
                                    return defer.promise;
                                }
                            ];
                        }
                    }
                }
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

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                $rootScope.$emit('stop', true);
            });

            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                $rootScope.$emit('stop', true);
            })
        }
    ]).filter('capitalize', function () {
        return function (input) {
            return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
        };
    })


