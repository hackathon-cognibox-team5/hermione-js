var attributeObj = {};
var attributeObjDefinition = {};

var JsModel = {
  attrs: {},

  create: function(properties, options) {
    var obj = _.extend({}, this.$instance);

    obj.attrs = _.extend({}, this.attrs);
    _.each(obj.attrs, function(value, key) {
      obj.attrs[key] = _.extend({}, attributeObj, value);
    });

    _.each(properties, function(value, key) {
      obj.attrs[key].value = value;
    });

    return obj;
  },

  extend: function(configuration, instanceMethods, classMethods) {
    var instanceObj = _.extend({}, this.$instance, classMethods);
    var classObj = _.extend({}, this, classMethods);

    instanceObj.$class = classObj;
    classObj.$instance = instanceObj;

    if (!configuration) configuration = {};

    if (configuration.attrs) {
      _.each(configuration.attrs, function(value, key) {
        classObj.attrs[key] = _.extend({}, attributeObjDefinition, value);
      });
    }

    return classObj;
  }
};

JsModel.$instance = {
  $class: JsModel,

  attrs: {}
};