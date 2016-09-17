require('../../tests_globals.js').init();
require('../../AsyncData.js');

//create AsyncData, user subscribed, load data to AsyncData, user gets data, read data again, user gets data again

var o = null;
var newData1 = { a: 1, b: "2", c: 3 };
var newData2 = { a: 2, b: "4", c: 3 };

it('should create AsyncData object', function(done) {
    o = new AsyncData();
    assert.instanceOf(o, AsyncData);

    assert.propertyVal(o, '_loaded'         , false);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_old_value'      , false);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    assert.property(o, 'getPromise');

    done();
});

var promise;

var update_cb, update_eb;

it("should subscribe user when user subscribes on events", function(done) {

    o.setUpdating(function(cb, eb) {
        update_cb = cb;
        update_eb = eb;
    });

    assert.propertyVal(o, '_loaded'         , false);
    assert.propertyVal(o, '_updating'       , true);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_old_value'      , false);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    done();
});

it('should load data to AsyncData', function(done) {

    update_cb(newData1);

    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_old_value'      , newData1);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    done();
});

var promise2;

it('should subscribe user when starts update data', function(done) {
    o.setUpdating(function(cb, eb) {
        update_cb = cb;
        update_eb = eb;
    });

    promise = o.getPromise();
    promise2 = o.getPromise();

    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , true);
    assert.propertyVal(o, '_old_value'      , newData1);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    done();
});

it('should load new data to AsyncData', function(done) {
    update_cb(newData2);

    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_old_value'      , newData2);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    done();
});


it('user gets new data', function(done) {
    promise.then(function(data) {
        assert(data, 'user subscribed');
        assertObjects(data, newData1);

        assert.propertyVal(o, '_loaded'         , true);
        assert.propertyVal(o, '_updating'       , false);
        assert.propertyVal(o, '_changed'        , false);
        assert.propertyVal(o, '_old_value'      , newData2);
        assert.propertyVal(o, '_error'          , false);
        assert.propertyVal(o, '_error_message'  , false);

        done();
    });
});

it('user2 gets data', function(done) {
    promise2.then(function(data) {
        assert(data, 'user subscribed');
        assertObjects(data, newData1);

        assert.propertyVal(o, '_loaded'         , true);
        assert.propertyVal(o, '_updating'       , false);
        assert.propertyVal(o, '_changed'        , false);
        assert.propertyVal(o, '_old_value'      , newData2);
        assert.propertyVal(o, '_error'          , false);
        assert.propertyVal(o, '_error_message'  , false);

        done();
    });
});

