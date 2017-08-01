"use strict";


angular.module("Inventory")


MCSIApp.controller('inventoryController', ['$scope', '$rootScope', '$location','$ocLazyLoad', '$localStorage', 'ngTableParams', 'ngTableParamsService', '$state', 'logger', 'CommonService', 'InventoryService',
    function ($scope, $rootScope, $location,$ocLazyLoad, $localStorage, ngTableParams, ngTableParamsService, $state, logger, CommonService, InventoryService) {


        var getData = ngTableParamsService.get();
        $scope.searchTextField = getData.searchText;
        $scope.searching1 = function (searchTextField) {
            console.log("searchTextField", searchTextField);
            ngTableParamsService.set('', '', $scope.searchTextField, '');
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.inventoryList = [];
                    InventoryService.getDrugList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.inventoryList = response.data;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getDrugList = function () {
            // var drugName = [];
            $scope.tableParams = new ngTableParams(ngTableParamsService.get(), {
                // counts: [],
                getData: function ($defer, params) {
                    // send an ajax request to your server. in my case MyResource is a $resource.
                    ngTableParamsService.set(params.page(), params.count(), $scope.searchTextField, params.sorting());
                    $scope.paramUrl = params.url();
                    $scope.tableLoader = true;
                    $scope.inventoryList = [];
                    InventoryService.getDrugList().get($scope.paramUrl, function (response) {
                        $scope.tableLoader = false;
                        $scope.inventoryList = response.data;
                        // console.log(response.data.length);
                        // for(var i=0;i<response.data.length;i++){
                        //         drugName.push(response.data[i].drugName);
                        // }
                        // $scope.drugName=drugName;
                        var data = response.data;
                        $scope.totalLength = response.totalLength;
                        params.total(response.totalLength);
                        $defer.resolve(data);
                    });
                }
            });
        };

        $scope.getDrugs = function () {
            var drugDetails = [];
            InventoryService.getDrugs().get(function (response) {
                if (response.code == 200) {
                    if (response.data == undefined) {
                        $scope.inventoryList = [];
                    } else {
                        $scope.inventoryList = response.data;
                    }
                    for (var i = 0; i < $scope.inventoryList.length; i++) {
                        drugDetails.push(response.data[i].drugDetails);
                    }
                    $scope.drugDetails = drugDetails;
                } else {
                   // alert("err in retriveing data");
                }
            });
        }

        $scope.showPredefinedDosage = 1;
        $scope.showPredefinedDosagefunc = function () {
            console.log("showPredefinedDosagefunc:--->", $scope.showPredefinedDosage);
            if($scope.showPredefinedDosage == 0){
                 if($scope.drug){ 
               $scope.drug.dosageNumber = 0;  
               $scope.drug.dosageValue = '';  
                 }
               $scope.showPredefinedDosage = 1;
            }
            else{
              if($scope.drug){
                 $scope.drug.stockNow = 0;  
              }
              $scope.showPredefinedDosage = 0;
            }
             console.log("showPredefinedDosagefunc:--->", $scope.showPredefinedDosage);
        }

        $scope.addNewDrug = function (drug) {
            console.log("drug--->", drug);
            console.log("$scope.drug--->", $scope.drug);
           
         
            
            if(isNaN(parseFloat($scope.drug.stockNow))){
                $scope.drug.stockNow = 0;
            }
            var quantity = $scope.drug.stockNow + $scope.drug.addToStock;
            console.log("quantity--->", quantity);
            console.log("$scope.drug.dosageNumber--->", $scope.drug.dosageNumber);
            console.log("$scope.drug.dosageValue--->", $scope.drug.dosageValue);

             var isDosageAlreadyPresent = 0;
            if($scope.drug.dosageNumber && $scope.drug.dosageValue) {
                var dosage = ($scope.drug.dosageNumber).toString() + $scope.drug.dosageValue;
               
                if ($scope.selectedObject && $scope.selectedObject.originalObject && $scope.selectedObject.originalObject.drugDetails) {
                    for (var i = 0; i < $scope.selectedObject.originalObject.drugDetails.length; i++) {
                        if (dosage == $scope.selectedObject.originalObject.drugDetails[i].dosage) {
                            isDosageAlreadyPresent = 1;
                            break;
                        }
                    }
                }
            }

            if (quantity >= 0 && isDosageAlreadyPresent == 0) {
                drug.drugDetails = {
                    quantity: $scope.drug.stockNow + $scope.drug.addToStock
                };
                console.log("$scope.selectedObject.originalObject--->", $scope.selectedObject.originalObject);
                
                 if ($scope.selectedObject.originalObject.drugName == undefined) {
                    //if other than existing selected
                   
                    drug.drugName = $scope.selectedObject.title;
                } else {
                    //if existing selected
                    drug._id = $scope.selectedObject.originalObject._id;
                }
                // if ($scope.selectedObject1.originalObject.quantity == undefined) {
                //     drug.drugDetails.dosage = $scope.selectedObject1.title;
                // } else {
                //     drug.drugDetails._id = $scope.selectedObject1.originalObject._id;
                // }
                if ($scope.dosage_id == undefined) {
                   // drug.drugDetails.dosage = $scope.drug.dosage;
                     drug.drugDetails.dosage = $scope.drug.dosageNumber + $scope.drug.dosageValue;
                 } else {
                    drug.drugDetails._id = $scope.dosage_id;
                }
                drug.drugDetails.updateQuantity = drug.updateQuantity;
                console.log("drug----->", drug);
                InventoryService.addNewDrug().save(drug, function (response) {
                    if (response.code == 200) {
                        logger.logSuccess(response.message);
                        $scope.getDrugs();
                    } else {
                         logger.logError(response.message);
                    }
                });
            }
          else {
                if (quantity <= 0) {
                    logger.logError('Operation not allowed');
                }
                else if (isDosageAlreadyPresent == 1) {
                    logger.logError('Dosage is already present,Please update already present dosage');
                }
            }
        }




        //$scope.selectedObject = {};
        $scope.drugNameFocusOut = function () {
            $scope.dosageList = [];
            setTimeout(function () {
                console.log("in drugNameFocusOut:---->", $scope.selectedObject.originalObject.drugDetails);      
                if ($scope.selectedObject.originalObject != undefined && $scope.selectedObject.originalObject.drugDetails && $scope.selectedObject.originalObject.drugDetails.length > 0) {
                    var drugDetials = $scope.selectedObject.originalObject.drugDetails;
                    for(var i = 0 ; i < drugDetials.length; i++){
                        $scope.dosageList.push({
                            id: drugDetials[i]._id,
                            dosage: drugDetials[i].dosage
                        });
                    }
                    console.log("dosage List:--->", $scope.dosageList);
                } 
                $scope.$apply();
            }, 200); 
        }
       
       $scope.drug = {
        }

        $scope.changeDosage = function (dosage) {
            console.log("changeDosage---->", dosage);
            if(dosage){
                
                $scope.selectedDosage = dosage;
                $scope.drug.dosage = dosage.dosage;
                $scope.drug.stockNow = dosage.quantity;
                $scope.dosage_id = dosage._id;
                $scope.drug.updateQuantity = dosage.updateQuantity
                console.log("changeDosage: selectedDosage----->",  $scope.drug.dosage);
                console.log("changeDosage: $scope.drug.stockNow----->",  $scope.drug.stockNow);
                console.log("changeDosage: $scope.dosage_id----->",  $scope.dosage_id);
                console.log("changeDosage: $scope.updateQuantity----->",  $scope.drug.updateQuantity);
            }
        };
 //$scope.drug.updateQuantity = $scope.selectedObject1.originalObject.updateQuantity;
        // $scope.selectDosageFocusOut = function () {
        //     setTimeout(function () {
        //         // console.log('quantity check',$scope.selectedObject1);
        //         if ($scope.selectedObject1.originalObject.quantity != undefined) {
        //             $scope.drug = { stockNow: $scope.selectedObject1.originalObject.quantity };

        //         } else {
        //             $scope.drug = { stockNow: 0 };
        //         }
        //         $scope.$apply();
        //     }, 200);
        // }

        $scope.deleteDrug = function (drugId, drugDetailId) {
            bootbox.confirm('Are you sure you want to delete this Drug', function (r) {
                if (r) {
                    InventoryService.deleteDrug().delete({ id: drugId, to: drugDetailId }, function (response) {
                        if (response.code == 200) {
                            $scope.getDrugList();
                            logger.logSuccess(response.message);
                        } else {
                            logger.logError(response.message);
                        }
                    });
                }
            })
        }

        $scope.remove = function (id) {
            bootbox.confirm('Are you sure you want to remove this drug details')
        }

        $scope.exportToExcel = function () {
            window.open(baseUrl + '/exportToExcelInvList/', '_blank');
        };
    }]);