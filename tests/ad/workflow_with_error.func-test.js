//create AsyncData, user subscribed, load data to AsyncData,
//user gets data, load data to AsyncData with error, user gets error message and have access to old data
var o = null;
var newData1 = { a: 1, b: "2", c: 3 };
var newData2 = { a: 2, b: "4", c: 3 };

var promise;
var update_cb, update_eb;

it('should create AsyncData object', function(done) {
    o = new AsyncData();
    promise = o.getPromise();
    o.setUpdating(function(cb, eb) {
        update_cb = cb;
        update_eb = eb;
    });
    done();
});

it('load data to AsyncData', function(done) {
    update_cb(newData1);
    done();
});

it('user gets the new data', function(done) {
    promise.then(function(data) {
        assert(data, 'user subscribed');
        assertObjects(data, newData1);
        assert.propertyVal(o, '_loaded'         , true);
        assert.propertyVal(o, '_updating'       , false);
        assert.propertyVal(o, '_changed'        , false);
        assert.propertyVal(o, '_old_value'      , newData1);
        assert.propertyVal(o, '_error'          , false);
        assert.propertyVal(o, '_error_message'  , false);
        promise = o.getPromise();
        done();
    });
});

it('load data to AsyncData with error', function(done) {
    o.setUpdating(function(cb, eb) {
        eb('Error TST19237')
    });
    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_old_value'      , newData1);
    assert.propertyVal(o, '_error'          , true);
    assert.propertyVal(o, '_error_message'  , 'Error TST19237');
    done();
});

it('load data with error fix', function() {
    o.setUpdating(function(cb, eb) {
        cb(newData2);
    });
    assertObjects(o, newData2);
    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_old_value'      , newData2);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);
});