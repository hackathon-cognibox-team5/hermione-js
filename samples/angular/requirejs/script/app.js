define(['angularAMD', './models/Person'],function(angularAMD, Person) {
  "use strict";
  var app = angular.module('app', [])
         .controller('appController', function appController($scope) {
    $scope.employee = Person.create({
      id: 1,
      firstName: "bob",
      lastName: "trudeau"
    });
    $scope.validAndChanged = function() {
      return $scope.employee.isValid(false) && !_.isEmpty($scope.employee.changedAttributes());
    };

    $scope.formatErrors = function(errors) {
      return _.chain(errors).values().flatten().value().join("<br/>");
    };
    $scope.submit = function() {
      $scope.employee.save();
    };
  });
  return angularAMD.bootstrap(app);
});