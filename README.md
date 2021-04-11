# slp-validate

[![Coverage Status](https://coveralls.io/repos/github/simpleledger/slp-validate.js/badge.svg?branch=master)](https://coveralls.io/github/simpleledger/slp-validate.js?branch=master)

Lightweight SLP validator with pre-broadcast validation and burn protection.

[![NPM](https://nodei.co/npm/slp-validate.png)](https://nodei.co/npm/slp-validate/)



## Installation

#### For node.js
`$ npm install slp-validate`

#### For browser
```<script src='https://unpkg.com/slp-validate'></script>```



## Example Usage

The recommended method to use for validation is `ValidatorType1.isValidSlpTxn()`.  This method can check transaction validity before it is broadcast to the network to prevent accidental burning. 

The following examples are provided in the examples directory:

 - `1-validate-tx-rpc-burn-valid-stop.ts`: Prevents accidental sending of a valid burn transaction
 - `2-validate-tx-rpc-burn-valid-allow.ts`: Allows sending a valid burn transaction
 - `3-validate-txid-rpc.ts`: Traditional SLP validate method by txid (offers no extra burn protection).
 - `4-validate-txid-bchd.ts`: Similar to example 3, but uses BCHD's gRPC instead of JSON RPC.
 - `5-validate-txid-gs++.ts`: Validate more quickly by downloading transactions in bulk from SLP graph search instead of downloading transactions individually via RPC.



## Unit Tests

`$ npm run test`

The majority of tests are driven by test vectors located in the [slp-unit-test-data](https://github.com/simpleledger/slp-unit-test-data.git) repository.



## Differential Testing

Run differential fuzzing with Electron Cash SLP edition by following the docs in [./fuzzer/README.md](./fuzzer/README.md).



## Code Coverage

`$ npm run test`

Once differential testing is setup, you can see the lines covered by the fuzzer testing for ./lib/slp.ts:
```
$ cd fuzzer
$ ./coverage.sh
```



## Change Log

### 1.2.2
- Fixed edge case for NFT child validation using updated set of SLP unit tests
- Removed extraneous transaction length check

### 1.2.1
- Fixed false positive case for MINT validation
- Added new methods "addValidTxnFromStore" and "addValidTxidFromStore" for pre-loading validator cache
- "addValidationFromStore" will be deprecated in the next version 1.3.0
- Updated Graph Search (via gs++) snippet in the examples directory 

### 1.2.0
- Update tsconfig & unit test config
- Linting nits
- (breaking change) Created Crypto.HashTxid() method and removed reverse from Crypto.Hash256(), removed Crypto.hash256()

### 1.1.3
- move @types/big.js to dep

### 1.1.2
- fixed missing index.d.ts file
- added differential fuzzing tests
- added code coverage

### 1.1.1
- added testing framework for differential fuzzing
- fix missing null check in parseSlpOutputScript

### 1.1.0
- fixed bug in isValidSlpTxn (issue #4)
- added JSDoc headers to some core methods in validation.ts
- use explicit checking of txn type when parsing SLP message
- fixed missing "unpkg" declaration in package.json
- more ts linting
- (breaking change) renamed MapCache to CacheMap
- (breaking change) removed .ts files from npm pkg, include .d.ts.

### 1.0.1
- fixed severe security vulnerability in parseSlpOutputScript
- add ts linting to the project
- add example for using gs++ as validation source

### 1.0.0
- ported validator from slpjs 0.21.3
- store cached transactions as buffer instead of a string
- add max cache size parameters in ValidatorType1 constructor



## Acknowledgements 

Thanks to [cryptophyl.com](https://cryptophyl.com) for sponsoring the initial effort required to create this library.
