(function() {
  var attributeObjDefinition = {};

  function createAttribute(properties) {
    var attrObject = _.extend({
      previousValue: undefined,
      isDirty: false,
      setPreviousValue: function(value) {
        this.isDirty = false;
        this.previousValue = value || this.value;
      }
    }, properties);

    var attrObjValue;
    Object.defineProperty(attrObject, 'value', {
      get: function() {
        return attrObjValue;
      },
      set: function(value) {
        if (!_.isEqual(attrObjValue, value)) {
          attrObject.isDirty = true;
        }

        attrObjValue = value;
      }
    });
  }

  function createAssociation(properties) {
    var assocObject = _.extend({

    }, properties);
    var assocValue;
    Object.defineProperty(assocObject, 'associations',{

    });

    return assocObject;
  }

  var JsModel = {
    attrs: {},

    // Model.create({ id: 1 })
    create: function(properties, options) {
      var obj = _.extend({}, this.$instance);

      obj.attrs = _.extend({}, this.attrs);
      _.each(obj.attrs, function(value, key) {
        obj.attrs[key] = createAttribute(value);
      });

      _.each(properties, function(value, key) {
        obj.attrs[key].value = value;
        obj.attrs[key].setPreviousValue();
      });

      return obj;
    },

    /*
      var User = Model.extend({
        name: "User"
      }, {
        fullName: function() { return this.firstName + this.lastName; }
      }, {
        get: function(options) { return this.sync("read", null, options); }
      });
    */
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

      if(configuration.associations) {
        classObj.associations = configuration.associations;
        instanceObj.associations = configuration.associations;
      }
      return classObj;
    }
  };
  JsModel.$instance = {
    $class: JsModel,

    attrs: {}
  };

  window.JsModel = JsModel;
})();
