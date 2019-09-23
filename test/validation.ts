import { ValidatorType1, GetRawTransactionAsync } from '../lib/validation';
import {Crypto } from '../lib/crypto';

import * as assert from 'assert';
import "mocha";

const txUnitTestData: SlpValidityUnitTest[] = require('slp-unit-test-data/tx_input_tests.json');

describe('Slp', function() {
    describe('isValidSlpTxid() -- SLP Transaction Validation Unit Tests', function() {
        txUnitTestData.forEach(test => {
            it(test.description, async () => {

                // Create method for serving up the unit test transactions 
                let getRawUnitTestTransaction: GetRawTransactionAsync = async (txid: string) => {
                    let allTxns: SlpTestTxn[] = test.when.concat(test.should);
                    let txn = allTxns.find(i => {
                        let hash = Crypto.hash256(Buffer.from(i.tx, 'hex')).toString('hex');
                        return hash === txid 
                    });
                    if(txn)
                        return txn.tx;
                    throw Error("Transaction data for the provided txid not found (txid: " + txid + ")")
                }
    
                // Create instance of Local Validator
                var slpValidator = new ValidatorType1({ getRawTransaction: getRawUnitTestTransaction });

                // Pre-Load Validator the unit-test inputs
                test.when.forEach(w => {
                    slpValidator.addValidationFromStore(w.tx, w.valid)
                });

                let txid = Crypto.hash256(Buffer.from(test.should[0].tx, 'hex')).toString('hex');
                let shouldBeValid = test.should[0].valid;
                let isValid = await slpValidator.isValidSlpTxid({ txid });
                if(isValid === false)
                    console.log('invalid reason:', slpValidator.cachedValidations.get(txid)!.invalidReason);
                assert.equal(isValid, shouldBeValid);
            });
        })
    });
});

interface SlpValidityUnitTest {
    description: string;
    when: SlpTestTxn[]
    should: SlpTestTxn[]
}

interface SlpTestTxn {
    tx: string, valid: boolean
}