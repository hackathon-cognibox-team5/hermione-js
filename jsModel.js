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

    var attrObjValue = properties.default; //default value
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
    var assocModel = modelMapping[self.model];
    var assocObject = _.extend({
      fetch: function() {
        var self = this;
        return fetch(this.url())
          .then(function(response) {
            return response.json();
          }).then(function(json) {
            json = assocModel.httpParse(json);
            var elements;

            if (_.isArray(json)) {
              _.each(json, function(element) {
                elements.push(assocModel.create(element));
              });
              json = elements;
            }
            else if (_.isArray(json.data)) {
              _.each(_.isArray(json.data), function(element) {
                elements.push(assocModel.create(element));
              });
              json.data = elements;
            }
            else if (_.isArray(json[pluralize(self.name)])) {
              _.each(_.isArray(json[pluralize(self.name)]), function(element) {
                elements.push(assocModel.create(element));
              });
              json[pluralize(self.name)] = elements;
            }

            return json;
          });
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
        var attr = createAssociation.call(obj, value);
        Object.defineProperty(obj.assocs, key, {
          get: function() {
            return attr;
          },
          set: function(value) {
            console.error("Not allowed, please use model.set({" + key + ":" + value +"})");
          }
        });
      });

      _.each(properties, function(value, key) {
        obj.attrs[key].value = value;
        obj.attrs[key].setPreviousValue();
      });

      obj.initialize(properties);
      obj.computeAssocs(properties);

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
    extend: function(classMethods, instanceMethods, attributeMethods) {
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
          return response.json();
        }).then(function(json) {
          json = self.httpParse(json);
          var elements;

          if (_.isArray(json)) {
            _.each(json, function(element) {
              elements.push(self.create(element));
            });
            json = elements;
          }
          else if (_.isArray(json.data)) {
            _.each(_.isArray(json.data), function(element) {
              elements.push(self.create(element));
            });
            json.data = elements;
          }
          else if (_.isArray(json[pluralize(self.name)])) {
            _.each(_.isArray(json[pluralize(self.name)]), function(element) {
              elements.push(self.create(element));
            });
            json[pluralize(self.name)] = elements;
          }

          return json;
        });
    },
    fetchOne: function(id) {
      var self = this;
      return fetch(this.url(id))
        .then(function(response) {
          return response.json();
        }).then(function(json) {
          return self.create(self.httpParse(json));
        });
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
    errors: {},

    changedAttributes: function() {

    },

    computeAssocs: function(data) {
      var self = this;

      var assocs = _.pick(data, _.keys(this.assocs));
      _.each(assocs, function(value, key) {
        var assocModel = modelMapping[self.assocs[key].model];
        if (self.assocs[key].type === "many") {
          _.each(value, function(v, k) {
            value[k] = assocModel.create(v);
          });
          self.assocs[key].value = value;
        } else if (self.assocs[key].type === "one") {
          self.assocs[key].value = assocModel.create(value);
        }
      });
    },

    delete: function() {
      return this.$class.delete(this.primaryKey());
    },

    errors: function() {
      var errors = {};
      _.each(this.attrs, function(attrObj, attrName) {
        if(!_.isEmpty(attrObj.errors))
          errors[attrName] = attrObj.errors;
      });
      return errors;
    },

    fetch: function() {
      return this.$class.fetchOne(this.attrs.id.value);
    },

    isValid: function(applyValidation) {
      // if applyValidation is set at false, skip validation process. Default is true
      if (applyValidation !== false )
        this.validate();
      return _.isEmpty(this.errors());
    },

    initialize: function() {},

    primaryKey: function() {
      var primaryKey = _.findKey(this.attrs, { primary: true });
      return (primaryKey && this.attrs[primaryKey].value) || this.attrs.id.value;
    },

    // send only changed data
    save: function() {
      if (this.attrs.id) {

      } else {

      }
    },

    set: function(properties) {
      var self = this;

      _.chain(properties).pick(_.keys(this.attrs)).each(function(value, key) {
        if (self.attrs[key]) {
          self.attrs[key].value = value;
        }
      }).value();

      obj.computeAssocs(properties);
    },

    url: function() {
      return buildUrl(this.baseUrl, this.name, this.primaryKey());
    },

    validate: function() {
      var self = this;
      self.errors = {};
      _.each(self.attrs, function(attr, key) {
        if(!attr.validate())
          self.errors[key] = attr.errors;
      });
      return this.isValid(false);
    }
  };

  window.JsModel = JsModel;

})();
