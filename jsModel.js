(function() {
  var attributeObjDefinition = {};
  var modelMapping = {};

  function buildUrl(baseUrl, resourceName, resourceId) {
    var url = baseUrl + pluralize(resourceName);

    if (resourceId) {
      url = url + "/" + resourceId;
    }

    return _.toLower(url);
  }

  function createAttribute(properties) {
    var attrObject = _.extend({
      $parent: this,
      previousValue: properties.value,
      isDirty: false,
      setPreviousValue: function(value) {
        this.isDirty = false;
        this.previousValue = value || this.value;
      },
      errors: {},
      validate: function() {
        var self = this;
        self.errors = {};
        _.each(self.validations, function(validation, key) {
          var singleValidation = {};
          singleValidation[key] = validation;
          var valid = validate.single(self.value, singleValidation);
          if(valid !== undefined)
            self.errors[key] = valid;
        });
        return this.isValid(false);
      },
      hasChanged: function() {
        return this.value !== this.previousValue;
      },
      isValid: function(applyValidation) {
        // if applyValidation is set at false, skip validation process. Default is true
        if(applyValidation !== false )
          this.validate();
        return _.isEmpty(this.errors);
      }
    }, properties);

    var attrObjValue = properties.value; //default value
    Object.defineProperty(attrObject, 'value', {
      get: function() {
        return attrObjValue;
      },
      set: function(value) {
        if (!_.isEqual(attrObjValue, value)) {
          this.isDirty = true;
        }

        attrObjValue = this.parse ? this.parse(value) : value;
        if(this.$parent.$class.autoValidate !== false)
          this.validate();

        return attrObjValue;
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
      var obj = _.extend({
        attrs: {},
        assocs: {}
      }, this.$instance);

      _.each(obj.$class.attrs, function(value, key) {
        var attr = createAttribute.call(obj, value);
        Object.defineProperty(obj.attrs, key, {
          get: function() {
            return attr;
          },
          set: function(value) {
            console.error("Not allowed, please use model.set({" + key + ":" + value +"})");
          }
        });
      });
      _.each(obj.$class.assocs, function(value, key) {
        obj.assocs[key] = createAssociation.call(obj, value);
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
        baseUrl: "http://hackathon.cognibox.net/",
        attrs: { "id": {}, "potato": {primary: true} }
      }, {
        fullName: function() { return this.firstName + this.lastName; }
      }, {
        get: function(options) { return this.sync("read", null, options); }
      });
    */
    extend: function(classMethods, instanceMethods) {
      var instanceObj = _.extend({ $super: this.$instance }, this.$instance);
      var classObj = _.extend({ $super: this }, this, classMethods);

      instanceObj.$class = classObj;
      classObj.$instance = instanceObj;

      _.each(classObj.attrs, function(value, key) {
        classObj.attrs[key] = _.extend({}, attributeObjDefinition, value);
      });

      if (classObj.name) {
        modelMapping[classObj.name] = classObj;
      }

      return classObj;
    },
    delete: function(id){
      return fetch(this.url(id),{method: 'delete'})
        .then(function(response) {
          return response.json();
        }).then(function(json){
          return json;
          }).catch(function (e){
            console.error(e);
            });
    },
    fetchAll: function() {
      var self = this;
      return fetch(this.url())
        .then(function(response) {
          return self.httpParse(response.json())
        }).then(function(json) {
          var elements;

          if (_.isArray(json)) {
            _.each(json, function(element) {
              elements.push(self.create(element));
            });
            json = elements;
          }
          else if (_.isArray(json['data'])) {
            _.each(_.isArray(json['data']), function(element) {
              elements.push(self.create(element));
            });
            json['data'] = elements;
          }
          else if (_.isArray(json[pluralize(self.configuration.name)])) {
            _.each(_.isArray(json[pluralize(self.configuration.name)]), function(element) {
              elements.push(self.create(element));
            });
            json[pluralize(self.configuration.name)] = elements;
          }

          return json;
        });
    },
    fetchOne: function(id) {
      var self = this;
      return fetch(this.url(id))
        .then(function(response) {
          return self.create(self.httpParse(response.json()));
        }
      );
    },
    httpParse: function(data, direction) {
      return data;
    },
    /* useless but can be overwitten */
    parse: function(properties) {
      return properties;
    },
    url: function(id) {
      return buildUrl(this.baseUrl, this.name, id);
    }
  };
  JsModel.$instance = {
    $class: JsModel,

    delete: function(){
      return this.$class.delete(this.primaryKey());
    },

    errors: function(){
      var errors={};
      _.each(this.attrs, function(attrObj, attrName){
        if(!_.isEmpty(attrObj.errors))
          errors[attrName] = attrObj.errors;
      });
      return errors;
    },

    validate: function() {
      var self = this;

      _.each(self.attrs, function(attr) {
        attr.validate();
      });
      return this.isValid(false);
    },

    isValid: function(applyValidation) {
      // if applyValidation is set at false, skip validation process. Default is true
      if(applyValidation !== false )
        this.validate();
      return _.isEmpty(this.errors());
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
      return buildUrl(this.$class.baseUrl, this.$class.name, this.primaryKey());
    }
  };

  window.JsModel = JsModel;

})();
