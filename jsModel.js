(function() {
  var attributeObjDefinition = {};
  var modelMapping = {};

  function buildUrl(resourceName, resourceId) {
    var url = "/" + pluralize(resourceName);

    if (resourceId) {
      url = url + "/" + resourceId;
    }

    return _.toLower(url);
  }

  function createAttribute(properties) {
    var attrObject = _.extend({
      previousValue: undefined,
      isDirty: false,
      setPreviousValue: function(value) {
        this.isDirty = false;
        this.previousValue = value || this.value;
      },
      errors: {},
      validate: function(){
        var self = this;
        self.errors = {};
        _.each(self.validations, function(validation, key){
          var singleValidation = {};
          singleValidation[key] = validation;
          var valid = validate.single(self.value, singleValidation);
          if(valid !== undefined)
            self.errors[key] = valid;
        });
        return this.isValid(false);
      },
      isValid: function(applyValidation){
        // if applyValidation is set at false, skip validation process. Default is true
        if(applyValidation !== false )
          this.validate();
        return _.isEmpty(this.errors);
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

    return attrObject;
  }

  function createAssociation(properties) {
    var self = this;
    var assocObject = _.extend({
      fetch: function() {
        return fetch(this.url())
          .then(function(response) {
            return response.json();
          }
        );
      },
      url: function() {
        return self.url() + '/' + modelMapping[this.model].name;
      }
    }, properties);
    return assocObject;
  }

  var JsModel = {
    attrs: {},

    // Model.create({ id: 1 })
    create: function(properties, options) {
      var obj = _.extend({}, this.$instance);

      obj.attrs = _.extend({}, this.attrs);
      _.each(obj.attrs, function(value, key) {
        obj.attrs[key] = createAttribute.call(this, value);
      });
      _.each(obj.assocs, function(value, key) {
        obj.assocs[key] = createAssociation.call(this, value);
      });

      _.each(properties, function(value, key) {
        obj.attrs[key].value = value;
        obj.attrs[key].setPreviousValue();
      });

      obj.initialize();

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

      if (configuration.attrs) {
        _.each(configuration.attrs, function(value, key) {
          classObj.attrs[key] = _.extend({}, attributeObjDefinition, value);
        });
      }

      if (configuration.name) {
        classObj.name = configuration.name;
        instanceObj.name = configuration.name;
        modelMapping[configuration.name] = classObj;
      }

      if(configuration.assocs) {
        classObj.assocs = configuration.assocs;
        instanceObj.assocs = configuration.assocs;
      }
      return classObj;
    },
    fetchAll: function() {
      return fetch(this.url())
        .then(function(response) {
          return response.json();
        }
      );
    },

    fetchOne: function(id) {
      return fetch(this.url(id))
        .then(function(response) {
          return response.json();
        }
      );
    },

    url: function(id) {
      return buildUrl(this.name, id);
    }
  };
  JsModel.$instance = {
    $class: JsModel,
    errors: {},
    validate: function(){
      var self = this;
      self.errors = {}
      _.each(self.attrs, function(attr, key){
        if(!attr.validate())
          self.errors[key] = attr.errors;
      });
      return this.isValid(false);
    },
    isValid: function(applyValidation){
      // if applyValidation is set at false, skip validation process. Default is true
      if(applyValidation !== false )
        this.validate();
      return _.isEmpty(this.errors);
    },
    fetch: function() {
      return this.$class.fetchOne(this.attrs.id.value);
    },

    initialize: function() {},

    primaryKey: function() {
      var primaryKey = _.findKey(this.attrs, { primary: true });
      return (primaryKey && this.attrs[primaryKey].value) || this.attrs.id.value;
    },

    set: function(properties) {
      var self = this;

      _.chain(properties).pick(_.keys(this.attrs)).each(function(value, key) {
        if (self.attrs[key]) {
          self.attrs[key].value = value;
        }
      }).value();
    },

    url: function() {
      return buildUrl(this.name, this.primaryKey());
    }
  };

  window.JsModel = JsModel;
  window.createAttribute = createAttribute;

})();
