import assert from "assert";
import { Slp } from "../lib/slp";

const scriptUnitTestData = require("slp-unit-test-data/script_tests.json");

describe("Slp", () => {

    describe("parseSlpOutputScript() -- SLP OP_RETURN Unit Tests", () => {
        scriptUnitTestData.forEach((test: any) => {
            it(test.msg, () => {
                const script = Buffer.from(test.script, "hex");
                const eCode = test.code;
                if (eCode) {
                    assert.throws(() => { Slp.parseSlpOutputScript(script); });
                } else {
                    const parsedOutput = Slp.parseSlpOutputScript(script);
                    assert(typeof parsedOutput, "object");
                }
            });
        });
    });
});
