"use strict"

angular.module("Users")

    .factory('UserService', ['$http', 'communicationService', '$resource', function ($http, communicationService, $resource) {
        /**
         * Function is use to User Modules changes are here 
         * @access private
         * @return json
         * Created by sunny 
         * @smartData Enterprises (I) Ltd
         * Created Date 26-April-2017
         */
        var getUsersList = function () {
            console.log("getUsersList");
            return $resource('/api/getUserList', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        var getRolesList = function () {
            return $resource('/api/getRoles', null, {
                get: {
                    method: 'GET'
                }
            });
        }


        var getuserbyId = function (id) {
            return $resource('/api/getuserbyId/' + id, null, {
                get: {
                    method: 'GET',
                    id: '@id'
                }
            });
        }




        var addUser = function () {
            return $resource('/api/addUser', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var addFamilyDoctor = function () {
            return $resource('/api/addFamilyDoctor', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var addDoctor = function () {
            return $resource('/api/addDoctor', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var addStatus = function () {
            return $resource('/api/addstatus', null, {
                save: {
                    method: 'POST'
                }
            });
        }


        var getDoctors = function () {
            return $resource('/api/getDoctorList', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        // var getStatus = function () {
        //     return $resource('/api/getStatus', null, {
        //         get: {
        //             method: 'GET'
        //         }
        //     });
        // }

        var getFamilyDoctors = function () {
            return $resource('/api/getFamilyDoctors', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        var getDoctorbyId = function () {
            return $resource('/api/getdoctorbyId/:id', null, {
                get: {
                    method: 'GET',
                    id: '@id'
                }
            });
        }



        var enableDisableUser = function () {
            return $resource('/api/enableDisableUser', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var getUserBidList = function () {
            return $resource('/api/getUserBidListAdmin', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var changePassword = function () {
            return $resource('/api/changePassword', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var adminProfileUpdate = function () {
            return $resource('/api/adminProfileUpdate', null, {
                save: {
                    method: 'POST'
                }
            });
        }

        var updateUserPic = function () {
            return $resource('/api/updateUserPic', null, {
                save: {
                    method: 'POST',
                    headers: { 'Content-Type': undefined }
                }
            });
        }

        var deleteUser = function () {
            return $resource('/api/deleteUserById/:id', null, {
                delete: {
                    method: 'DELETE',
                    id: '@id'
                }
            });
        }

        var getkupatCholim = function () {
            return $resource('/api/getkupatCholim', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        var getUserByToken = function (id) {
            return $resource('/api/getUserByToken', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        var updateColorStatus = function () {
            return $resource('/api/updateColorStatus', null, {
                save: {
                    method: 'POST'

                }
            });
        }

        var colorStatusbyId = function (id) {
            return $resource('/api/colorStatusbyId/' + id, null, {
                get: {
                    method: 'GET',
                    id: '@id'
                }
            });
        }

        var getStatus = function () {
            return $resource('/api/getStatus', null, {
                get: {
                    method: 'GET'
                }
            });
        }
        
        var resetPassword = function () {
            return $resource('/api/resetPassword', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var addOrUpdateIp = function () {
            return $resource('/api/addOrUpdateIp', null, {
                save: {
                    method: 'POST'
                }
            });
        }
        var updateProfile = function () {
            return $resource('/api/updateProfile', null, {
                get: {
                    method: 'POST'
                }
            });
        }

        var getSettingsData = function () {
            return $resource('/api/getSettingsData', null, {
                get: {
                    method: 'GET'
                }
            });
        }

        return {
            addUser: addUser,
            getUsersList: getUsersList,
            getFamilyDoctors: getFamilyDoctors,
            addFamilyDoctor: addFamilyDoctor,
            getRolesList: getRolesList,
            enableDisableUser: enableDisableUser,
            deleteUser: deleteUser,
            getuserbyId: getuserbyId,
            getkupatCholim: getkupatCholim,
            getUserByToken: getUserByToken,
            colorStatusbyId: colorStatusbyId,
            updateColorStatus: updateColorStatus,
            getStatus: getStatus,
            resetPassword: resetPassword,
            addOrUpdateIp: addOrUpdateIp,
            updateProfile: updateProfile,
            getSettingsData: getSettingsData
            // getuserbyId: getuserbyId,
            // getDoctorbyId: getDoctorbyId,

            // getDoctors: getDoctors,
            // addStatus: addStatus,
            // addDoctor: addDoctor,

            //-------------------------------//
            // addUpdateUser: addUpdateUser,
            // updateUserPic: updateUserPic,
            // deleteUser: deleteUser,
            // enableDisableUser: enableDisableUser,
            // changePassword: changePassword,
            // adminProfileUpdate: adminProfileUpdate,
            // getUserBidList: getUserBidList
        }

    }]);
