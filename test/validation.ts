import {Crypto } from "../lib/crypto";
import { GetRawTransactionAsync, ValidatorType1 } from "../lib/validation";

import * as assert from "assert";
import "mocha";

const txUnitTestData: SlpValidityUnitTest[] = require("slp-unit-test-data/tx_input_tests.json");

describe("Slp", () => {
    describe("isValidSlpTxid() -- SLP Transaction Validation Unit Tests", () => {
        txUnitTestData.forEach((test) => {
            it(test.description, async () => {

                // Create method for serving up the unit test transactions
                const getRawUnitTestTransaction: GetRawTransactionAsync = async (txid: string) => {
                    const allTxns: SlpTestTxn[] = test.when.concat(test.should);
                    const txn = allTxns.find((i) => {
                        const hash = Crypto.hash256(Buffer.from(i.tx, "hex")).toString("hex");
                        return hash === txid;
                    });
                    if (txn) {
                        return txn.tx;
                    }
                    throw Error("Transaction data for the provided txid not found (txid: " + txid + ")");
                };

                // Create instance of Local Validator
                let slpValidator = new ValidatorType1({ getRawTransaction: getRawUnitTestTransaction });

                // Pre-Load Validator the unit-test inputs
                test.when.forEach((w) => {
                    slpValidator.addValidationFromStore(w.tx, w.valid);
                });

                const txid = Crypto.hash256(Buffer.from(test.should[0].tx, "hex")).toString("hex");
                const shouldBeValid = test.should[0].valid;
                let isValid;
                try {
                    isValid = await slpValidator.isValidSlpTxid({ txid });
                } catch (error) {
                    if (error.message.includes("Transaction data for the provided txid not found") &&
                        test.allow_inconclusive && test.inconclusive_reason === "missing-txn") {
                            isValid = false;
                    } else {
                        throw error;
                    }
                }
                if (isValid === false) {
                    console.log("invalid reason:", slpValidator.cachedValidations.get(txid)!.invalidReason);
                }
                assert.equal(isValid, shouldBeValid);
            });
        });
    });
});

interface SlpValidityUnitTest {
    description: string;
    when: SlpTestTxn[];
    should: SlpTestTxn[];
    allow_inconclusive: boolean;
    inconclusive_reason: string;
}

interface SlpTestTxn {
    tx: string;
    valid: boolean;
}
