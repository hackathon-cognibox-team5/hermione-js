# Class methods

### Dependencies

* [Lodash](https://lodash.com/)

#### Extend
The extend method is used to create a new entity based on another one. By default you just extend the standard api.
```js
var User = Api.extend({
  // configuration
}, {
  // instance method
}, {
  // class method
});
```

#### Configure name
The `name` attribute is the model name. It will be used for relations, building the url and other stuff like that
```js
var User = Api.extend({
  name: "user"
});
```

#### Configure attributes
Attributes is the model set of attributes.
Possible `attribute` definition:
- `primary`: boolean, only one attribute can be set to primary. If no attributes is set to primary, the id attributes is set to primary.
- `type`: string
- `validation`: set of validation criterion
```js
var User = Api.extend({
    attributes: {
      id: { primary: true, type: "integer" },
      username: { type: "string" }
    }
});
```

#### Configure validationFunctions
Set of functions used for validations.
- The first argument of each function will be the attribute to validate
- The second argument is the value passed in the attribute definition
```js
var User = Api.extend({
    attributes: {
      id: { primary: true, type: "integer" },
      username: { type: "string", validations: { max: 150 } }
    },
    validationFunctions: {
      max: function(attributeKey, validationValue) { return this.attributes[attributeKey] <= validationValue; }
    }
});
```

#### Configure associations
Set of associations.
Possible `attribute` definition:
- `type`: ``["many", "one"]`` are the possible values. Used to know if the associations will be a simple object or an array of objects
- `model`: string, the associated model name.
```js
var User = Api.extend({
    associations: {
      groups: { type: "many", model: "group" }
    }
});
```

#### fetchAll
```js
User.fetchAll();
```

#### fetchOne
```js
User.fetchOne(id);
```

#### create
```js
var user = User.create({ id: 5, username: "jean" });
```

# Instance methods

#### fetch
```js
user.fetch();
```

#### save
```js
user.save();
```

#### delete
```js
user.delete();
```

#### attribute:value
```js
user.attrs.username.value = "john";
```

#### isValid
Can be set to automatically run validation on attributes changes
```js
user.attrs.username.isValid(); // check if the current attribute is valid
user.isValid(); // check if all attributes are valid
```

#### hasChanged
Can be set to automatically run validation on attributes changes
```js
user.attrs.username.hasChanged(); // check if the current attribute is valid
user.hasChanged(); // check if all attributes are valid
```

#### isDirty
Set automatically to `true` if `attribute` has changed at least one time
```js
user.attrs.username.isDirty;
```

#### association:fetch
```js
user.assocs.groups.fetch();
```
