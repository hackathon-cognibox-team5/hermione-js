var JsModel = {
  create: function(properties, options) {
    return _.extend({}, $this.instance);
  },

  extend: function(configuration, instanceMethods, classMethods) {
    var instanceObj = _.extend({}, this.$instance, classMethods);
    var classObj = _.extend({}, this, classMethods);

    instanceObj.$class = classObj;
    classObj.$instance = instanceObj;

    return classObj;
  }
};

JsModel.$instance = {
  $instance: JsModel
};