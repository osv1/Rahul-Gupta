"use strict";


angular.module("Survey")


MCSIApp.controller('surveyController', ['$scope', '$rootScope', '$location','$ocLazyLoad', '$localStorage', '$state','logger', 'CommonService', 'SurveyService',
    function ($scope, $rootScope, $location,$ocLazyLoad, $localStorage, $state, logger, CommonService, SurveyService) {

        $scope.questionelemnt = [{ question: ''}];

        //Add new question 
        $scope.newItem = function ($event) {
            $scope.questionelemnt.push({ question: '', type: ''});
            $event.preventDefault();
        };
        
        //Add Survey
         $scope.addSurvey = function (survey) {
             var id;
             var surveyData ={};
             if($scope.survey && $scope.survey.id){
               id = $scope.survey.id;
               surveyData.id = id;
             }
            //console.log("$scope.questionelemnt:-->", $scope.questionelemnt);
            var level = [];
            var question = [];
            Array.prototype.push.apply(level, [survey.level1, survey.level2, survey.level3, survey.level4, survey.level5, survey.level6]);

            angular.forEach($scope.questionelemnt, function (value, key) {
                if(value.question !== ''){
                  question.push({
                      description: value.question,
                      type: value.questionType
                  });
                }
            });
            surveyData.level = level;
            surveyData.question = question;
            surveyData.name = "Survey";
            
            console.log("SurveyData--->", surveyData);
            SurveyService.addSurvey().save(surveyData, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                     logger.logError(response.message);
                 }
            });
        };

        //Get survey details
         $scope.getSurveyDetails = function () {
            $scope.$emit('start', true);
             SurveyService.getSurveyDetails().get(function (response) {
                 if (response.code == 200 && response.data[0]) {
                     var surveydetails = response.data[0].question;
                     //console.log("---surveydetails---", surveydetails);
                     angular.forEach(surveydetails, function (value, key) {
                          $scope.questionelemnt.unshift({ id: key, question: value.description, questionType: value.type });
                     });
                     $scope.survey = {};
                     $scope.survey.id = response.data[0]._id;
                     $scope.survey.level1 = response.data[0].level[0];
                     $scope.survey.level2 = response.data[0].level[1];
                     $scope.survey.level3 = response.data[0].level[2];
                     $scope.survey.level4 = response.data[0].level[3];
                     $scope.survey.level5 = response.data[0].level[4];
                     $scope.survey.level6 = response.data[0].level[5];
                 } else {
                     logger.logError(response.message);
                 }
                 $scope.$emit('stop', true);
             });
         };

         //Get survey for visitId
          $scope.getSurveyById = function () {
           var visitDetails = {
               id: $state.params.id
           };
           SurveyService.getSurveyById().save(visitDetails,function (response) {
                if (response.code == 200) {
                    if (response.data) {
                        $scope.surveyData = response.data;
                        console.log("$scope.surveyData: ", $scope.surveyData);
                    }
                } else {
                    logger.logError(response.message);
                }
            });
        };

        //Submit filled survey for visitId
         $scope.submitSurvey = function () {
            console.log("$scope.surveyData", $scope.surveyData);
            SurveyService.submitSurvey().save($scope.surveyData, function (response) {
                if (response.code == 200) {
                    logger.logSuccess(response.message);
                } else {
                     logger.logError(response.message);
                 }
            });
        };
    }]);