define(['angularAMD', 'Hermione'],function(angularAMD, Hermione) {
  "use strict";
  var app = angular.module('app', [])
         .controller('appController', function appController($scope) {
    var Person = Hermione.extend({
      name: "employee",
      baseUrl: "",
      attrs: {
        id: {},
        firstName: { validations: { length: { maximum: 20 } } },
        lastName: { validations: { length: { maximum: 20 } } }
      }
    });
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