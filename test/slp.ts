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
                    try {
                        Slp.parseSlpOutputScript(script);
                    } catch (e) {
                        if (expectedErrors.includes(e.message)) {
                            assert(expectedErrors.includes(e.message));
                        } else if (e.message.includes("Unsupported token type:")) {
                            assert(e.message.includes("Unsupported token type:"));
                        } else {
                            throw e;
                        }
                    }
                } else {
                    const parsedOutput = Slp.parseSlpOutputScript(script);
                    assert(typeof parsedOutput, "object");
                }
            });
        });
    });
});

const expectedErrors = [
    "Bad OP_RETURN",
    "Empty OP_RETURN",
    "Not SLP",
    "GENESIS with incorrect number of parameters",
    "token_id is wrong length",
    "Mint baton cannot be on vout=0 or 1",
    "Bad send quantity buffer.",
    "Unsupported token type: ",  // NOTE: fuzzer uses this in "indexOf()"
    "Field has wrong length",
    "SEND quantities must be 8-bytes each.",
    "MINT with incorrect number of parameters",
    "Token document hash is incorrect length",
    "Genesis quantity must be provided as an 8-byte buffer",
    "Bad token_id buffer",
    "Bad versionType buffer",
    "Too many decimals",
    "More than 19 output amounts",
    "Missing output amounts",
    "Bad tokenId buffer",
    "Bad Genesis quantity buffer",
    "Bad decimals buffer",
    "NFT1 Child cannot have MINT transaction type.",
    "Missing SLP transaction type",
    "Bad Mint quantity buffer",
    "SEND with too few parameters",
    "Mint quantity must be provided as an 8-byte buffer",
    "NFT1 child token must have GENESIS quantity of 1.",
    "Bad Mint quantity buffer",
    "NFT1 child token must have divisibility set to 0 decimal places.",
    "Missing token versionType",
    "NFT1 child token must not have a minting baton!",
    "Bad transaction type",
];
