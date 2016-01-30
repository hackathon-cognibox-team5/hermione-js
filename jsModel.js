var attributeObj = {};
var attributeObjDefinition = {};

function buildUrl(resourceName, resourceId, extension) {
  var url = "/" + resourceName;

  if (resourceId) {
    url = url + "/" + resourceId;
  }

  if (extension) {
    url = url + "." + extension;
  }
};

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

    if (configuration.name) {
      classObj.name = configuration.name;
      instanceObj.name = configuration.name;
    }

    return classObj;
  },

  fetchAll: function() {
    return fetch(this.url())
      .then(function(response) {
        return response.json()
      }
    );
  },

  fetchOne: function(id) {
    return fetch(this.url(id))
      .then(function(response) {
        return response.json()
      }
    );
  },

  url: function(id) {
    buildUrl(this.name, id, _.findKey( this.attrs, 'extension' ));
  }

};

JsModel.$instance = {
  $class: JsModel,

  attrs: {},

  primaryKey: function() {
    return _.find(this.attrs, { primaryKey: true }) || this.attrs.id.value;
  },

  url: function() {
    buildUrl(this.name, this.primaryKey(), _.findKey( this.attrs, 'extension' ));
  }
};
