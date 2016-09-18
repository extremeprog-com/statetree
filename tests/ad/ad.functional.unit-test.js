require('../../tests_globals.js').init();
require('../../AsyncData.js');

//should create AsyncData, should show changes when object is changed

var o = null;


function generateEmptyObject() {
    return new AsyncData();
}

function generateReadyObject() {
    var o = new AsyncData();
    o.setUpdating(function(cb, eb) {
        cb({ a: 1, b: "2", c: 3 });
    });
    return o;
}

it('should show changed when object is changed', function(done) {

    o = generateEmptyObject();
    o.a = 3;
    assert(o.isChanged());

    o = generateReadyObject();
    o.a = 3;
    assert(o.isChanged());

    o = generateReadyObject();
    o.t = {
        Id: '222'
    };
    assert(!o.isChanged());

    o = generateReadyObject();
    o.a = 3;
    o.b = 5;
    o.t = {
        Id: '222'
    };
    assertObjects(o.getChangedFields(), {a: 3, b: 5});

    done();
});

it('check rejection', function(done) {

    o = generateReadyObject();
    o.setUpdating(function(accept, error, reject) {
        reject();
    });

    assert.propertyVal(o, '_loaded'         , true);
    assert.propertyVal(o, '_updating'       , false);
    assert.propertyVal(o, '_changed'        , false);
    assert.propertyVal(o, '_error'          , false);
    assert.propertyVal(o, '_error_message'  , false);

    done();
});

