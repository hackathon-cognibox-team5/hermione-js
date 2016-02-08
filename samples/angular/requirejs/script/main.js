(function() {
  require.config({
    baseUrl: "script",
    paths: {
        'angular': '../bower_components/angular/angular',
        'angularAMD': '../bower_components/angularAMD/angularAMD',
        'Hermione': '../bower_components/hermione/hermione',
        'lodash': '../bower_components/lodash/dist/lodash',
        'pluralize': '../bower_components/pluralize/pluralize',
        'validate': '../bower_components/validate/validate',
        'fetch': '../bower_components/fetch/fetch',
        'es6-promise':'../bower_components/es6-promise/promise',
    },
    shim: {
      'angularAMD': ['angular']
    },
    deps: ['app']
});
}());