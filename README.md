# statetree
Library for creation data-oriented architecture of web applications.

## AsyncData
AsyncData is a wrapper for objects that are often being updated, changed and synced.

### Initialization
```javascript
var User = new AsyncData();
```

### Properties
```javascript
User._loaded        // identificator that the object is loaded or not
User._updating      // identificator that the object is updating or not
User._changed       // identificator that the object has been changed locally (and is not saved)
User._old_value     // contains old version of the object
User._error         //
User._error_message //
```

### Methods
**getPromise**
***

Returns a Promise object which you can use to know if the data has been loaded/updated.

```javascript
User.getPromise().then(function() {
    console.log(User.Name + 'has been updated');
})
```

**_update**
***

Calls resolve when data is received from the server, merges data.

```javascript
User.setUpdating(function(apply, error, reject) {
    $http
        .post('/api/users', User)
        .success(function() {
            apply();
        })
        .error(function() {
            reject();
            error();
        })
})
```

**isChanged**
***

Checks if the object has been changed locally.

```javascript
if(User.isChanged()) console.log(User.Name + 'changed');
```

**getChangedFields**
***

Returns fields that have been changed locally.

```javascript
User.setUpdating(function(apply, error, reject) {
    $http
        .post('/api/users', User.getChangedFields())
        .success(function() {
            apply();
        })
        .error(function() {
            reject();
            error();
        })
})
```

**revert**
***

Revert old value

```javascript
User.setUpdating(function(apply, error, reject) {
    $http
        .post('/api/users', User)
        .success(function() {
            apply();
        })
        .error(function() {
            reject();
            User.revert();
        })
})
```