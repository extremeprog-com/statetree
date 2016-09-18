var
    resolves = new WeakMap()
    , promises = new WeakMap();

function default_merge_fn(object, data, bypassFields) {
    // check if given data is Array of Objects (with field :Id)
    if( object instanceof Array && data instanceof Array) {
        var shouldBeInArray = [];
        for(var i = 0; i < data.length; i++) {
            var currentObject = object.filter(function(it) {
                return (it.Id    && it.Id   == data[i].Id)
            })[0];
            if(currentObject) {
                default_merge_fn(currentObject, data[i], bypassFields);
            } else {
                object.push(data[i]);
            }
            shouldBeInArray.push(currentObject || data[i]);
        }
        while(object.length) {
            object.shift();
        }
        shouldBeInArray.map(function(it) {
            object.push(it);
        });
    } else {
        var fields = []
            .concat(Object.keys(object))
            .concat(Object.keys(data))
            .filter(function(it, i, arr) { return arr.indexOf(it) == i;});

        fields.map(function(field) {
            if(bypassFields && bypassFields.indexOf(field) > -1 || field[0] == '$') return;

            if(object[field] && data[field] && typeof object[field] == 'object' && typeof data[field] == 'object') {
                default_merge_fn(object[field], data[field], bypassFields);
            } else if(!data.hasOwnProperty(field)) {
                delete object[field];
            } else {
                object[field] = data[field];
            }
        });
    }
}

/**
 * Async Data Object
 * @constructor
 */
AsyncData = function(custom_merge_fn) {
    Object.defineProperty(this, '_loaded'       , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_updating'     , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_changed'      , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_old_value'    , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_error'        , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_error_message', { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_merge_fn'     , { enumerable: false, value: custom_merge_fn || default_merge_fn, writable: true });
};

/**
 * getPromise
 * @function
 *
 * @returns {Promise} promise object which you can use to know if the data has been loaded/updated from the server
 */
AsyncData.prototype.getPromise = function() {
    var _this = this;
    if(!promises[this]) {
        promises[this] = new Promise(function(resolve, reject) {
            resolves[_this] = function() {
                resolve(true);
            }.bind(this);
        });
        promises[this].then(function(d) {
            delete promises[this];
            delete resolves[this];

            return d;
        });
        promises[this].then(function(d) {
            return d;
        })
    }
    return promises[this]
};


/**
 * setUpdating
 * @function
 *
 * calls resolve when data is received from the server, merges data
 */
AsyncData.prototype.setUpdating = function(cb) {
    this._updating = true;
    cb(
        function(new_data) {
            this._loaded = true;
            this._old_value = new_data;
            this._updating = false;
            this._error = false;
            this._error_message = false;
            this._merge_fn(this, new_data);
            resolves[this] && resolves[this](this);
        }.bind(this),
        function(err_message) {
            this._updating = false;
            this._error = true;
            this._error_message = err_message;
        }.bind(this),
        function() {
            this._updating = false;
        }.bind(this)
    )
};

/**
 * isChanged
 * @function
 * Check if the object has been changed by user
 */
AsyncData.prototype.isChanged = function() {
    // compare this and this._old_value
    return (function cmp(obj, old) {
        var keys = [], key;
        for(key in obj) {
            if(obj.hasOwnProperty(key) && obj[key] && !obj[key].Id) {
                keys.push(key);
            }
        }
        for(key in old) {
            if(old.hasOwnProperty(key) && keys.indexOf(key) === -1 && old[key] && !old[key].Id) {
                return true;
            }
        }
        for(var i = 0; i < keys.length; i++) {
            key = keys[i];
            if(typeof obj[key] == 'object' && typeof old[key] == 'object') {
                if(!cmp(obj[key], old[key])) {
                    return true;
                }
            }
            else if(obj[key] != old[key]) {
                return true;
            }
        }
        return false;
    })(this, this._old_value || {});
};

/**
 * getChangedFields
 * @function
 */
AsyncData.prototype.getChangedFields = function() {
    return (function(obj, old) {
        var keys = [], key, changed = {};
        for(key in obj) {
            if(obj.hasOwnProperty(key) && obj[key] && !obj[key].Id) {
                keys.push(key);
            }
        }
        for(key in old) {
            if(old.hasOwnProperty(key) && keys.indexOf(key) === -1 && old[key] && !old[key].Id) {
                keys.push(key);
            }
        }
        for(var i = 0; i < keys.length; i++) {
            key = keys[i];
            if(old[key] != obj[key]) {
                changed[key] = obj[key];
            }
        }
    })(this, this._old_value || {})
};