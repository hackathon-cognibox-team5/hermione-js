(function(global, factory) {
  if ((typeof exports === 'object') && (typeof module !== 'undefined')) {
    if (typeof global.Promise === 'undefined') {
      require('es6-promise').polyfill();
    }
    if (typeof global.fetch === 'undefined') {
      global.fetch = require('fetch');
    }
    module.exports = factory(require('lodash'), require('pluralize'), require('validate'));
  } else if ((typeof define === 'function') && (define.amd)) {
    var factoryWithPolyfills = function($Promise, $fetch, lodash, pluralize, validate) {
      if (typeof $Promise !== 'undefined') {
        $Promise.polyfill();
      }
      if (typeof $fetch !== 'undefined') {
        global.fetch = $fetch;
      }
      return factory(lodash, pluralize, validate);
    };
    var factoryWithFetchPolyfill = function ($fetch, lodash, pluralize, validate) {
      if (typeof $fetch !== 'undefined') {
        global.fetch = $fetch;
      }
      return factory(lodash, pluralize, validate);
    };
    if (typeof global.Promise === 'undefined') {
      define(['es6-promise','fetch','lodash','pluralize','validate'], factoryWithPolyfills);
    } else if (typeof global.fetch === 'undefined') {
      define(['fetch','lodash','pluralize','validate'], factoryWithFetchPolyfill);
    } else {
      define(['lodash','pluralize','validate'], factory);
    }
  } else {
    global.Hermione = factory(global._, global.pluralize, global.validate);
  }
}(this, function(_, pluralize, validate) {
  if (typeof Promise === 'undefined') {
    console.error("[hermione.js] Promise is undefined." +
                  " Please load a Promise polyfill before loading Hermione.js");
  }
  if (typeof fetch === 'undefined') {
    console.error("[hermione.js] fetch is undefined." +
                  " Please load a fetch polyfill before loading Hermione.js");
  }
  if ((typeof _ === 'undefined') || (typeof _.VERSION === 'undefined'))  {
    console.error("[hermione.js] lodash is undefined."+
                  " Please load lodash before loading Hermione.js");
  }
  if (typeof pluralize === 'undefined') {
    console.error("[hermione.js]pluralize is undefined. Please load before loading Hermione.js");
  }
  if ((typeof validate === 'undefined') || (typeof validate.version === 'undefined') ){
    console.error("[hermione.js] validate.js is undefined." +
                  " Please load validate.js before loading Hermione.js");
  }
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
    if (!properties) properties = {};

    var attrObjValue = properties.default; //default value
    var defaultAttrProp = {
      _value: {
        get: function() {
          return attrObjValue;
        },
        set: function(value) {
          if (!_.isEqual(attrObjValue, value)) {
            this.isDirty = true;
          }

          attrObjValue = this.parse ? this.parse(value) : value;

          return attrObjValue;
        }
      }
    };


    var parentAttrObjValueProp = _.extend({}, defaultAttrProp._value, this.$class.$super.$attrOb && this.$class.$super.$attrOb._value);
    var parentAttrObj = _.extend({}, defaultAttrProp, this.$class.$super.$attrOb, { _value: parentAttrObjValueProp });

    var attrObjValueProp = _.extend({}, defaultAttrProp._value, this.$class.$attrObj._value);
    var attrObject = _.extend({
        $parent: this,
        $super: parentAttrObj,
        previousValue: properties.default,
      },
      defaultAttrProp,
      this.$class.$attrObj,
      properties,
      { _value: attrObjValueProp }
    );

    Object.defineProperty(attrObject, 'value', {
      enumerable: true,
      get: function() {
        return this._value.get.call(this);
      },
      set: function(value) {
        return this._value.set.call(this, value);
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
            json = assocModel.httpParse(json,"get");
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
    $attrObj: {
      isDirty: false,
      setPreviousValue: function(value) {
        this.isDirty = false;
        this.previousValue = value || this.value;
      },
      hasChanged: function() {
        return this.value !== this.previousValue;
      }
    },

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
          enumerable: true,
          get: function() {
            return attr;
          },
          set: function(value) {
            console.error("[hermione.js] Not allowed, please use model.set({" + key + ":" +
                          value +"})");
          }
        });
      });

      _.each(obj.$class.assocs, function(value, key) {
        var attr = createAssociation.call(obj, value);
        Object.defineProperty(obj.assocs, key, {
          enumerable: true,
          get: function() {
            return attr;
          },
          set: function(value) {
            console.error("[hermione.js] Not allowed, please use model.set({" + key + ":" +
                          value +"})");
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
      var instanceObj = _.extend({ $super: this.$instance }, this.$instance, instanceMethods);
      var classObj = _.extend({ $super: this }, this, classMethods);
      var attrObj = _.extend({ }, this.$attrObj, attributeMethods);

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
          .catch(function (e){
            console.error(e);
            });
    },
    fetchAll: function() {
      var self = this;
      return fetch(this.url())
        .then(function(response) {
          return response.json();
        }).then(function(json) {
          json = self.httpParse(json, "get");
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

    httpParse: function(data, method) {
      if(_.includes(["put", "post"],method))
        return JSON.stringify(data);
      else {
        return data;
      }
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
        body: this.httpParse(data, "post")
      });
    },
    put: function(id, data) {
      return fetch(this.url(id), {
        method: 'put',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: this.httpParse(data, "put")
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
      _.each(this.$class.attrs, function(attr) {
        attr.setPreviousValue();
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

    fetch: function() {
      var self = this;
      return fetch(this.url(this.id))
        .then(function(response) {
          return response.json();
        }).then(function(json) {
          json = self.$class.httpParse(json, "get");
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
      var attributes = this.changedAttributes();
      var data = {};

      // New record
      if (!this.primaryKeyValue()) {
        _.each(this.attrs, function(attr, key) {
          if (attr.value !== undefined) data[key] = attr.value;
        });

        this.$class.post(data);
        // Update record
      } else if (!_.isEmpty(attributes)) {
        var pKey = this.primaryKey();
        _.each(this.attrs, function(attr, key) {
          if (attr.value !== undefined && key !== pKey) data[key] = attr.value;
        });

        this.$class.put(this.primaryKeyValue(), data);
      }
    },

    set: function(properties) {
      var self = this;

      _.chain(properties).pick(_.keys(this.attrs)).each(function(value, key) {
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

  /****************************************************************
  ***************************Validations***************************
  *****************************************************************/

  console.log("11");

  Hermione = Hermione.extend({

  }, {
    validationErrors: function() {
      var errors = {};
      _.each(this.attrs, function(attrObj, attrName) {
        if(!_.isEmpty(attrObj.validationErrors))
          errors[attrName] = attrObj.validationErrors;
      });
      return errors;
    },

    validate: function() {
      _.each(self.attrs, function(attr) {
        attr.validate();
      });
      return this.isValid(false);
    },

    isValid: function(applyValidation) {
      // if applyValidation is set at false, skip validation process. Default is true
      if (applyValidation !== false )
        this.validate();
      return _.isEmpty(this.validationErrors());
    }
  }, {
    _value: {
      set: function(value) {
        console.log("????");
        if(this.$parent.$class.autoValidate !== false)
            this.validate();

        return this.$super._value.set.call(this, value);
      }
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
    isValid: function(applyValidation) {
      // if applyValidation is set at false, skip validation process. Default is true
      if(applyValidation !== false )
        this.validate();
      return _.isEmpty(this.validationErrors);
    }
  });

  return Hermione;
}));
