# slp-validate

Lightweight SLP validator with pre-broadcast validation and burn protection.

[![NPM](https://nodei.co/npm/slp-validate.png)](https://nodei.co/npm/slp-validate/)



## Installation

#### For node.js
`npm install slp-validate`

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



## Change Log

### 1.0.0
- ported validator from slpjs 0.21.3
- store cached transactions as buffer instead of a string
- Add max cache size parameters in ValidatorType1 constructor



## Acknowledgements 

Thanks to [cryptophyl.com](https://cryptophyl.com) for sponsoring the initial effort required to create this library.
