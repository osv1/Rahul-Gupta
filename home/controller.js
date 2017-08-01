"use strict";

angular.module("Home")

MCSIApp.controller("homeController", ['$scope', '$rootScope', '$localStorage', '$location','$ocLazyLoad', '$translate', '$modal', '$sce', 'HomeService', 'hotkeys', 'socket', 'webNotification',
	function ($scope, $rootScope, $localStorage, $location,$ocLazyLoad, $translate, $modal, $sce, HomeService, hotkeys, socket, webNotification) {
		$scope.counts = {};
		$rootScope.modalItems = [];
		$rootScope.menuHome = ['familyDoctors',
		'add_family_Doctors',
		'statuses',
		'dashboard',
		'status_edit',
		'index',
		'edit_disease',
		'index_add',
		'Diseases',
		'updatetest',
		'add_disease',
		'users',
		'addUser',
		'users_edit',
		'roles',
		'editRoles',
		'kupatCholim_list',
		'addkupatCholim',
		'editKupatCholim',
		'Test',
		'survey',
		'addIndexTriage',
		'addIndexDisease',
		'edit_triage',
		'addRole',
		'rolePermissions',
		'ipSettings'
		];
		
		$rootScope.menuPatient = ['activePatient',
		'patientList',
		'addPatient',
		'patientdashboard',
		'addVisitReason',
		'addNewVisitReason',
		'editVisitReason',
		'editPatientIdentification',
		'editPayment',
		'editTriage',
		'editNurseExam',
		'visitDetails',
		'editDoctorExam',
		'doctorSummary',
		'doctorResult',
		'doctorResultFollowUp',
		'doctorPrescription',
		'visitCard',
		'newVisitCard',
		'prescription',
		'result',
		'summary',
		'visitDocument',
		'patientVisitHistory',
		'visitHistory',
		'patientDrugListing',
		'patientSummary',
		'visitcomment',
		'patientDebt',
		'doctorOrder',
		'doctorTreatment',
		'activePatientByDr'
		];
		
		$rootScope.menuInventory = [
		'inventoryList',
		'addDrug'];
		
		$rootScope.menuReport = [
		'reportDashboard',
		'visitorsResultReport',
		'visitResultHistoryReport',
		'currentDiseaseReport',
		'currentDiseaseHistoryReport',
		'invChangeReport',
		'invChangeHistoryReport',
		'drugsGiveAwayReport',
		'drugsGiveAwayHistoryReport',
		'kupatCholimReport',
		'kupatCholimHistoryReport'
		];


		// hotkeys.add({
		// 	combo: 'f6',
		// 	description: 'Go to active patient listing',
		// 	callback: function(event, hotkey) {
		// 		 $state.go('activePatient');
		// 	}
		// });

		$scope.activationMessage = function () {
			$scope.parmas = $location.search();
			$scope.success = $scope.parmas.success;
			console.log($scope.success);
		}

		$scope.selectedLanguage = $translate.use();

		$scope.changeLanguage = function () {
			console.log('1 $localStorage.lang: ', $localStorage.lang);
			console.log('Before changeLanguage: ', $scope.selectedLanguage);
			$localStorage.lang = $scope.selectedLanguage;
			console.log('2 $localStorage.lang: ', $localStorage.lang);
			if ($scope.selectedLanguage == 'hw') {
				$localStorage.css = 'main_a';
				$rootScope.css = 'main_a';
				$rootScope.toastBase = 'toast-top-left';
			}
			else {
				$localStorage.css = 'main';
				$rootScope.css = 'main';
				$rootScope.toastBase = 'toast-top-right';
			}
			$translate.use($scope.selectedLanguage);
			var selectedLanguage = $scope.selectedLanguage;
          	HomeService.updateLanguage().save({selectedLanguage},function(response){
				 if (response.code == 200) {
                } 
            })

		};

		$scope.getCounts = function () {
			HomeService.getCounts().get(function (response) {
				if (response.code == 200) {
					$scope.counts = response.data;
				}
			});
		}

		socket.on('showDiseaseAlert', function (data) {
			console.log("showDiseaseAlert recived", data);
			var popupopen = ($rootScope.modalItems).indexOf(data.data.alertId) > -1;
			console.log("ispopupopen", popupopen);
			if (popupopen === false) {
				$rootScope.modalItems.push(data.data.alertId);
				$scope.viewAlert('diseaseAlert', data);
			}
		});

		socket.on('showTriageAlert', function (data) {
			console.log("data: in showTriageAlert:", data.data);
			var popupopen = ($rootScope.modalItems).indexOf(data.data.alertId) > -1;
			console.log("ispopupopen", popupopen);
			if (popupopen === false) {
				$rootScope.modalItems.push(data.data.alertId);
				$scope.viewAlert('triageAlert', data);
			}
		});


		// $scope.viewAlert = function (type, data) {
		// 	console.log('type: ', type);
		// 	console.log('data: ', data);
		// 	var modalInstance;
		// 	modalInstance =
		// 		$modal.open({
		// 			templateUrl: '/modules/patient/views/' +
		// 			type + '.html',
		// 			controller: "homeViewController",
		// 			resolve: {
		// 				data: function () {
		// 					return {
		// 						data: data
		// 					};
		// 				}
		// 			}
		// 		});
		// };


		$scope.viewAlert = function (type, data) {
			console.log('type: ', type);
			console.log('viewAlert data: ', data.data);
			var AlertBody = "";
			var title = "";
			if (type == "triageAlert") {
				title = "Triage Alert Notification";
				AlertBody = "Patient Name: " + data.data.patientInfo.name + "\u000d Alert Reason: ";
                
				var triageTakenTime = '';
				if(data.data.triages){
					   var triagesList = data.data.triages;
					   console.log("triagesList--->", triagesList);
						triagesList.forEach(function (item) {
						console.log("item--->", item);
						AlertBody += 
							item.name + ": " + item.value + ", ";
						
						   triageTakenTime = item.time;
				        });
				}

				AlertBody += "\u000d On test done at:  " + triageTakenTime;
			    console.log("AlertBody:--->", AlertBody);
				
			}
			else if (type == "diseaseAlert") {
				title = "Disease Alert Notification";
				
				AlertBody = "Patient Name: " + data.data.patientInfo.name + "\u000d Alert Reason: \u000d";
				if(data.data.diseases){
				   var diseaseList = data.data.diseases;
                   diseaseList.forEach(function (item) {
						console.log("item--->", item);
						AlertBody += 
						  "- " +	item.name + "\u000d"
				    });
				}
			}
		
			var modalInstance;
			modalInstance =
				$modal.open({
					templateUrl: '/modules/patient/views/' +
					type + '.html',
					controller: "homeViewController",
					resolve: {
						data: function () {
							return {
								data: data
							};
						}
					}
				});

			webNotification.showNotification(title, {
				body: $sce.trustAsHtml(AlertBody),
				icon: baseUrl + '/assets/images/favicon.ico',
				// icon: 'http://52.39.212.226:5054/assets/images/logo.png',
				onClick: function onNotificationClicked() {
					var triageURL = baseUrl + '/#/visitDetails-edit/' + data.data.visitId;
					console.log("triageURL-->", triageURL);
					window.open(triageURL);
					console.log('Notification clicked.');
				},
			}, function onShow(error, hide) {
				if (!("Notification" in window)) {
					console.log("This browser does not support desktop notification");
				} else if (Notification.permission === "granted") {
					//var notification = new Notification("Hi there!");
				} else if (Notification.permission !== 'denied' || Notification.permission === "default") {
					Notification.requestPermission(function (permission) {
						if (permission === "granted") {
							//var notification = new Notification("Hi there!");
						}
					});
				}
				if (error) {
					window.alert('Unable to show notification: ' + error.message);
				} else {
					console.log('Notification Shown.');
					setTimeout(function hideNotification() {
						console.log('Hiding notification....');
						hide();
					}, 50000);
				}
			});

		};
        //   $scope.toggle = function (data) {
		// 	  console.log("XX");
        //     $scope.toggle = data ? true : false;
        // }

	}]);

MCSIApp.controller("homeViewController", ['$scope', '$rootScope', '$localStorage', '$location', '$translate', 'HomeService', 'socket', '$modal', '$modalInstance', 'PatientService', 'data',
	function ($scope, $rootScope, $localStorage, $location, $translate, HomeService, socket, $modal, $modalInstance, PatientService, data) {
		$scope.currentDate = new Date();
		$scope.data = data.data.data;
		console.log('-------------------data 2------------------', $scope.data);
		if ($scope.data && $scope.data.triages) {
			var traigeList = $scope.data.triages;
			for (var i = 0; i < traigeList.length; i++) {
				$scope.triageTakenTime = traigeList[i].time;
				console.log("$scope.triageTakenTime:", $scope.triageTakenTime);
			}
		}
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');

			for (var i = 0; i < $rootScope.modalItems.length; i++) {
				if ($rootScope.modalItems[i] === $scope.data.alertId) {
					$rootScope.modalItems.splice(i, 1);
				}
			}
		};
		$scope.goToTriage = function () {
			//$modalInstance.close();
			$modalInstance.dismiss('cancel');
			$location.path('/visitDetails-edit/' + $scope.data.visitId);
		};
	}]);






