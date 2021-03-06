
# Hermione.js

## About

Everybody had a classmate that knew everything about anything, much like [Hermione](http://harrypotter.wikia.com/wiki/Hermione_Granger) from the Harry Potter series. While your project is the main character, Hermione.js serves the knowledge. Disclaimer, this is a weekend Hackathon effort.

## Purpose

Hermione.js maps a REST API to an object data model. The main difference with other model layer libraries such as [js-model](https://github.com/benpickles/js-model) or [Backbone.Model](http://backbonejs.org/#Model) is the handling of attributes as objects with their own functions defined lower in this README.


## Installation

Available on [Bower](http://bower.io) as **hermione**.

```sh
$ bower install hermione
```

## Class methods

#### create
Create an object for this resource.
```js
var user = User.create({ id: 5, username: "jean" });
```

#### extend
The extend method is used to create a new entity based on another one. By default you just extend
the standard api.
```js
var User = Hermione.extend({
  // class methods
}, {
  // instance methods
}, {
  // attributes methods
});
```

#### fetchAll
Returns all objects of the resource as an array of objects. If meta-data is provided in the json
reponse, this is kept alongside the array of objects.
```js
User.fetchAll();
```

#### fetchOne
Returns an object for a single resource.
```js
User.fetchOne(id);
```

#### url
Returns the full url to the resource.
```js
User.url(id);
```

## Class configuration

#### Associations
Set of associations.
Possible `attribute` definition:
- `type`: ``["many", "one"]`` are the possible values. Used to know if the associations will be a
  simple object or an array of objects
- `model`: string, the associated model name.
```js
var User = Hermione.extend({
    associations: {
      groups: { type: "many", model: "group" }
    }
});
```

#### Attributes

Attributes is the model set of attributes.
Possible `attribute` definition:
- `primary`: boolean, only one attribute can be set to primary. If no attributes is set to primary, the id attributes is set to primary.
- `default`: Object
- `validations`: set of validation criterion, see https://validatejs.org/#validators for available validations patterns.
```js
var User = Hermione.extend({
    attributes: {
      id: { primary: true },
      username: { default: "admin" }
    }
});
```

#### Name
The `name` attribute is the model name. It will be used for relations, building the url and other stuff like that
```js
var User = Hermione.extend({
  name: "user"
});
```

#### Validation functions
Set of functions used for validations.
- The first argument of each function will be the attribute to validate
- The second argument is the value passed in the attribute definition
```js
var User = Hermione.extend({
    attributes: {
      id: { primary: true },
      username: { default: "admin", validations: { length: {maximum: 150 }} }
    },
    validationFunctions: {
      max: function(attributeKey, validationValue) { return this.attributes[attributeKey] <= validationValue; }
    }
});
```

# Instance methods

#### association:fetch
```js
user.assocs.groups.fetch();
```

#### attribute:value
```js
user.attrs.username.value = "john";
```

#### delete
Deletes the resource.
```js
user.delete();
```

#### fetch
Returns an object representing the resource.
```js
user.fetch();
```

#### hasChanged
Can be set to automatically run validation on attributes changes
```js
user.attrs.username.hasChanged(); // check if the current attribute has changed
user.hasChanged(); // check if all attributes have changed.
```

#### primaryKey
Returns the value of the primary key (default primary key is `id`).
```js
user.primaryKey();
```

#### isDirty
Set automatically to `true` if `attribute` has changed at least one time.
```js
user.attrs.username.isDirty;
```

#### isValid
```js
var User = Hermione.extend({
      name: "User",
      baseUrl: "http://your.website.net/",
      attrs: {  id: {primary: true, validations: {presence: true}},
                name: {validations: {presence: true, length: {minimum: 3}}}
             }
    }, {
      fullName: function() { return this.firstName + this.lastName; }
    }, {
      get: function(options) { return this.sync("read", null, options); }
    });
```

Can be set to automatically run validation on attributes changes
```js
var user = User.create({id: 1, name: "John"});
user.attrs.name.isValid(); // check if the current attribute is valid
user.isValid(); // check if all attributes are valid
```

Validation is automatically refreshed on value change:
```js
user.attrs.name.value = "Do";
user.errors;
//Output: is too short (minimum is 3 characters)
user.isValid(); // check if all attributes are valid
```

Validation is automatically refreshed on value change:
```js
user.attrs.name.value = "Do";
user.errors;
//Output: is too short (minimum is 3 characters)
user.isValid(); // check if all attributes are valid
```

#### save
```js
user.save();
```

#### url
Returns the full url to the resource.
```js
user.url();
```
