(function() {
  require.config({
    baseUrl: "script",
    paths: {
        'angular': '../bower_components/angular/angular',
        'angularAMD': '../bower_components/angularAMD/angularAMD',
        'Hermione': '../../../../hermione',
        'lodash': '../../../../bower_components/lodash/lodash',
        'pluralize': '../../../../bower_components/pluralize/pluralize',
        'validate': '../../../../bower_components/validate/validate'
    },
    shim: {
      'angularAMD': ['angular']
    },
    deps: ['app']
});
}());