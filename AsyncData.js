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
    //Object.defineProperty(this, '_stack'        , { enumerable: false, value: new Error().stack });
};

/**
 * getPromise
 * @function
 *
 * @returns {Promise} promise object which you can use to know if the data has been loaded/updated from the server
 */
AsyncData.prototype.getPromise = function() {
    var _this = this;
    if(!promises.get(_this)) {
        promises.set(_this, new Promise(function(resolve, reject) {
            resolves.set(_this, function() {
                resolve(true);
            });
        }));
        promises.get(_this).then(function() {
            promises.delete(_this);
            resolves.delete(_this);
        });
    }

    return promises.get(_this)
};


/**
 * setUpdating
 * @function
 *
 * calls resolve when data is received from the server, merges data
 */
AsyncData.prototype.setUpdating = AsyncData.prototype._update = function(cb) {
    if(!(cb instanceof Function)) {
        if(cb) {
            this._old_value = cb;
            this._merge_fn(this, cb);
            return;
        } else {
            return {
                diff: diff.bind(this)
            }
        }
    }

    this._updating = true;

    var apply = function(new_data) {
        this._loaded = true;
        this._old_value = new_data;
        this._updating = false;
        this._error = false;
        this._error_message = false;
        if(!new_data) {
            (function clone(to, from){
                Object.keys(from).map(function(key) {
                    if(from[key] && typeof from[key] == 'object') {
                        clone(to[key] = from[key] instanceof Array ? [] : {}, from[key])
                    } else {
                        to[key] = from[key]
                    }
                })
            })(this._old_value = {}, this);
        } else {
            this._merge_fn(this, new_data);
        }
        resolves.get(this) && resolves.get(this)(this);
    }.bind(this);

    apply.diff = diff.bind(this);

    function diff(to, from) {
        if(!from) {
            throw Error("second argument to diff(to, from) should be object");
        }
        ([].concat(Object.keys(to)).concat(Object.keys[from])).map(function(key) {
            if(typeof to[key] == 'undefined') {
                delete this._old_value[key];
                delete this[key];
            } else {

                if (typeof from[key] == 'undefined') {
                    if (to[key] && typeof to[key] == 'object') {
                        this[key] = to[key] instanceof Array ? [] : {};
                        this._old_value[key] = to[key] instanceof Array ? [] : {};
                    }
                }

                if (to[key] && typeof to[key] == 'object') {
                    this._merge_fn(this[key], to[key]);
                    this._old_value[key] = to[key];
                } else {
                    this[key] = to[key];
                    this._old_value[key] = to[key];
                }
            }
        }.bind(this));

        this._loaded = true;
        this._updating = false;
        this._error = false;
        this._error_message = false;
        resolves.get(this) && resolves.get(this)(this);
    }

    var error = function(err_message) {
        this._updating = false;
        this._error = true;
        this._error_message = err_message;
    }.bind(this);

    var reject = function() {
        this._updating = false;
    }.bind(this);

    cb(apply, error, reject)
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
            if(old.hasOwnProperty(key) && key.indexOf('$$') < 0 && keys.indexOf(key) === -1 && old[key] && !old[key].Id) {
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
            else if(obj[key] != old[key] && key.indexOf('$$') < 0) {
                return true;
            }
        }
        return false;
    })(this, this._old_value || {});
};

/**
 * getChangedFields
 * @function
 * 
 * Get fields that have been changed locally
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
        return changed;
    })(this, this._old_value || {})
};

/**
 * revert
 * @function
 * 
 * Revert old value
 */
AsyncData.prototype.revert = function() {
    this._merge_fn(this, this._old_value);
};