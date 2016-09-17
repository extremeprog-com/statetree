var
    resolves = new WeakMap()
    , promises = new WeakMap();

/**
 * Async Data Object
 * @constructor
 */
AsyncData = function() {
    Object.defineProperty(this, '_loaded'       , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_updating'     , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_changed'      , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_old_value'    , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_error'        , { enumerable: false, value: false, writable: true });
    Object.defineProperty(this, '_error_message', { enumerable: false, value: false, writable: true });
};

/**
 * getPromise
 * @function
 *
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
            deepMergeData(this, new_data);
            resolves[this] && resolves[this](this);
        }.bind(this),
        function(err_message) {
            this._updating = false;
            this._error = true;
            this._error_message = err_message;
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
        var keys = Object.keys(obj), key;
        for(key in old) {
            if(old.hasOwnProperty(key) && keys.indexOf(key) === -1) {
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


// make deep merge with saving object links
function deepMergeData(object, data, bypassFields) {

    if(object.hasOwnProperty('Id') && !(object instanceof AsyncData)) {
        object.__proto__ = AsyncData.prototype;
        if(!oldDataTree[object.Id]) oldDataTree[object.Id] = object;
    }

    // check if given data is Array of Objects (with field :Id)
    if( object instanceof Array &&
        data   instanceof Array &&
        object.reduce(function(r, it) { return r && it.hasOwnProperty('Id') || r && it.hasOwnProperty('Key') }, true) &&
        data  .reduce(function(r, it) { return r && it.hasOwnProperty('Id') || r && it.hasOwnProperty('Key') }, true)
    ) {
        var shouldBeInArray = [];
        for(var i = 0; i < data.length; i++) {
            var currentObject = object.filter(function(it) {
                return (it.Id    && it.Id   == data[i].Id)
                    || (it.Key   && it.Key  == data[i].Key)
                    || (it.Guid  && it.Guid == data[i].Guid)
                    || (it.Value && data[i].Value && it.Value.Id == data[i].Value.Id)
            })[0];
            if(currentObject) {
                deepMergeData(currentObject, data[i], bypassFields);
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

            if(field == 'Columns') { // todo remove this hack
                if(!(data[field] instanceof Array)) {
                    data[field] = Object.keys(data[field])
                        .map(function(key) { return data[field][key] });
                }
                if(typeof data['TotalRowCount'] == 'undefined') {
                    data['TotalRowCount'] = data['PreviewRowCount'] || 1000; // todo: remove after fixing bugs
                }
            }

            if(object[field] && data[field] && typeof object[field] == 'object' && typeof data[field] == 'object') {
                deepMergeData(object[field], data[field], bypassFields);
            } else if(!data.hasOwnProperty(field)) {
                delete object[field];
            } else {
                object[field] = data[field];
            }
        });
    }
}
