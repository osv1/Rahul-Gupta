/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
MCSIApp.directive('validPasswordC', function () {
  return {
    require: 'ngModel',
    scope: {

      reference: '=validPasswordC'

    },
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function (viewValue, $scope) {

        var noMatch = viewValue != scope.reference
        ctrl.$setValidity('noMatch', !noMatch);
        return (noMatch) ? noMatch : !noMatch;
      });

      scope.$watch("reference", function (value) {
        ;
        ctrl.$setValidity('noMatch', value === ctrl.$viewValue);

      });
    }
  }
});

MCSIApp.directive("raty", function () {
  return {
    restrict: 'AE',
    link: function (scope, elem, attrs) {
      $(elem).raty({ score: attrs.score, number: attrs.number, readOnly: attrs.readonly });
    }
  }
});

MCSIApp.filter("trust", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);

MCSIApp.directive('preloader', function () {
  return {
    restrict: 'A',
    template: '',
    link: function (scope, elm, attrs) {
      $(elm).hide();
      scope.$on('start', function () {
        elm.addClass('loading-spiner-holder');
        $(elm).show();
      });
      scope.$on('stop', function () {
        $(elm).hide();
      });
    }
  };
});

MCSIApp.directive("daterangepicker", function () {

        function link(scope, element, attrs) {
            // CALL THE "datepicker()" METHOD USING THE "element" OBJECT.
            element.daterangepicker({
                timePicker: true,
                autoApply: true,
                minDate: new Date(),
                //autoUpdateInput: false,
                opens: 'center',
                 locale: {
                   format: 'DD/MM/YYYY hh:mm A'
                  // format: "dddd: HH:mm"
                 }
            });
        }

        return {
            require: 'ngModel',
            link: link
        };
});

MCSIApp.directive("weekdaysrangepicker", function () {

        function link(scope, element, attrs) {
            // CALL THE "datepicker()" METHOD USING THE "element" OBJECT.
            element.daterangepicker({
                timePicker: true,
                autoApply: true,
                opens: 'center',
                 startDate: "Friday: 07:00 AM",
                 endDate: "Sunday: 06:59 AM",
                 locale: {
                  // format: 'DD/MM/YYYY hh:mm A'
                   format: "dddd: hh:mm A"
                 }
            });
        }

        return {
            require: 'ngModel',
            link: link
        };
});


MCSIApp.directive("toggleOffCanvas",[function(){
  return{
    restrict:"A",
    link:function(scope,ele)
    {
      return ele.on("click",function()
      {
        return $("#app").toggleClass("on-canvas")
      }
      )
    }
  }
}])