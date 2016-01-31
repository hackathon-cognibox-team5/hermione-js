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
      validationErrors: {},
      validate: function() {
        var self = this;
        self.validationErrors = {};
        _.each(self.validations, function(validation, key) {
          var singleValidation = {};
          singleValidation[key] = validation;
          var valid = validate.single(self.value, singleValidation);
          if(valid !== undefined)
            self.validationErrors[key] = valid;
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
        return _.isEmpty(this.validationErrors);
      }
    }, this.$class.$attrObj, properties);

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

  var Hermione = {
    attrs: {},

    // Model.create({ id: 1 })
    create: function(properties, options) {
      var obj = _.extend({
        attrs: {},
        assocs: {}
      }, this.$instance);

      properties = obj.parse(properties);

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

      _.each(_.pick(properties, _.keys(obj.$class.attrs)), function(value, key) {
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
      var attrObj = _.extend({}, this.$attrObj, attributeMethods);

      instanceObj.$class = classObj;
      classObj.$instance = instanceObj;
      classObj.$attrObj = attrObj;

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
          var elements = [];

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
      return this.create({ id: id }).fetch();
    },

    httpParse: function(data, direction) {
      return data;
    },

    /* useless but can be overwitten */
    parse: function(properties) {
      return properties;
    },
    post: function(data) {
      fetch(this.url(), {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: this.httpParse(data)
      });
    },
    put: function(id, data) {
      return fetch(this.url(id), {
        method: 'put',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: this.httpParse(data)
      });
    },

    url: function(id) {
      return buildUrl(this.baseUrl, this.name, id);
    }
  };
  Hermione.$instance = {
    $class: Hermione,

    changedAttributes: function() {
      var changed = {};
      _.each(this.attrs, function(attrObj, attrName) {
        if(attrObj.hasChanged())
          changed[attrName] = attrObj.value;
      });
      return changed;
    },

    cleanAttributes: function() {
      var self = this;
      _.each(this.$class.attrs, function(attr, key) {
        self.attrs[key].setPreviousValue();
      });
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

    delete: function(){
      return this.$class.delete(this.primaryKeyValue());
    },

    validationErrors: function() {
      var errors = {};
      var self = this;
      _.each(this.$class.attrs, function(attrObj, attrName) {
        var obj = self.attrs[attrName];
        if(!_.isEmpty(obj.validationErrors))
          errors[attrName] = obj.validationErrors;
      });
      return errors;
    },

    validate: function() {
      var self = this;

      _.each(self.$class.attrs, function(attr, attrName) {
        self.attrs[attrName].validate();
      });
      return this.isValid(false);
    },

    isValid: function(applyValidation) {
      // if applyValidation is set at false, skip validation process. Default is true
      if (applyValidation !== false )
        this.validate();
      return _.isEmpty(this.validationErrors());
    },

    fetch: function() {
      var self = this;
      return fetch(this.url(this.id))
        .then(function(response) {
          return response.json();
        }).then(function(json) {
          json = self.$class.httpParse(json);
          json = self.parse(json);
          self.set(json);
          self.cleanAttributes();
          return self;
        });
    },

    initialize: function() {},

    /* useless but can be overwitten */
    parse: function(properties) {
      return properties;
    },

    primaryKey: function() {
      return _.findKey(this.$class.attrs, { primary: true }) || "id";
    },

    primaryKeyValue: function() {
      return this.attrs[this.primaryKey()].value;
    },

    save: function() {
      var self = this;
      var attributes = this.changedAttributes();
      var data = {};

      if (_.isEmpty(this.primaryKeyValue())) {
        _.each(this.$class.attrs, function(attr, key) {
          if (self.attrs[key].value !== undefined) data[key] = self.attrs[key].value;
        });

        this.$class.post(data);
      } else if (!_.isEmpty(attributes)) {
        _.each(this.$class.attrs, function(attr) {
          if (self.attrs[key].value !== undefined) data[key] = self.attrs[key].value;
        });

        this.$class.put(this.primaryKey(), data);
      }
    },

    set: function(properties) {
      var self = this;

      _.chain(properties).pick(_.keys(this.$class.attrs)).each(function(value, key) {
        if (self.attrs[key]) {
          self.attrs[key].value = value;
        }
      }).value();

      self.computeAssocs(properties);
    },

    url: function() {
      return buildUrl(this.$class.baseUrl, this.$class.name, this.primaryKeyValue());
    }
  };

  window.Hermione = Hermione;

})();