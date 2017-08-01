'use strict';
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
MCSIApp.factory("logger", ['$rootScope', function($rootScope) {
    var logIt;
    var clear;
   
    return toastr.options = {
            closeButton: true,
            preventDuplicates: true,
            positionClass: $rootScope.toastBase,
            onclick: null,
            timeOut: "3000",
            showMethod: "fadeIn",
            hideMethod: "fadeOut"
        },

        logIt = function(message, type, timeOut) {
            if (timeOut) {
                toastr.options.timeOut = timeOut;
                toastr.options.extendedTimeOut = timeOut;
                toastr.options.tapToDismiss = false;
            } else {
                toastr.options.tapToDismiss = true;
            }
            return toastr[type](message)
        },
        clear = function() {
            toastr.clear();
        }, {
            log: function(message) {
                toastr.options.positionClass= $rootScope.toastBase;
                logIt(message, "info")
            },
            logWarning: function(message) {
                toastr.options.positionClass= $rootScope.toastBase;
                logIt(message, "warning")
            },
            logSuccess: function(message) {
                toastr.options.positionClass= $rootScope.toastBase;
                logIt(message, "success")
            },
            logError: function(message, timeOut) {
                toastr.options.positionClass= $rootScope.toastBase;
                logIt(message, "error", timeOut)
            },
            clear: function() {
                clear();
            }
        }
}])
