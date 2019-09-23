import { Slp } from '../lib/slp';
import assert from 'assert';

const scriptUnitTestData = require('slp-unit-test-data/script_tests.json');

describe('Slp', function() {

    describe('parseSlpOutputScript() -- SLP OP_RETURN Unit Tests', function() {
        scriptUnitTestData.forEach((test: any)=> {
            it(test.msg, () => {
                let script = Buffer.from(test.script, 'hex');
                let eCode = test.code;
                if(eCode) {
                    assert.throws(function() { Slp.parseSlpOutputScript(script) });
                } else {
                    let parsedOutput = Slp.parseSlpOutputScript(script);
                    assert(typeof parsedOutput, 'object');
                }
            });
        });
    });
});