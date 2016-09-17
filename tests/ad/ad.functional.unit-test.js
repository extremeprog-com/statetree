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

    done();
});
