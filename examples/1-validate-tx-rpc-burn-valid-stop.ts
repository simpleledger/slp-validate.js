/***************************************************************************************
 *
 *  Example 1: Check transaction validity pre-broadcast. This example prevents burning
 *              tokens in otherwise valid SLP transactions.  Even though both
 *              transactions listed below are both valid in terms of SLP consensus rules,
 *              this example code catches Error thrown when "valid inputs > outputs" and
 *              returns invalid.
 *
 *              See Example 2 to learn how to allow burning.
 *
 *  Instructions:
 *      (1) - Set bitcoind RPC user, password, and URL.
 *      (2) - Optional: set custom transaciton hex data.
 *
 * ************************************************************************************/

import { Big } from "big.js";
import { ValidatorType1 } from "../lib/index";
const RpcClient = require("bitcoin-rpc-promise-retry");

const RPC_USER_NAME = "bitcoin";
const RPC_PASSWORD = "password";
const RPC_URL = "localhost:8332";

// valid. (valid inputs === outputs)
// const txn = "01000000067fb42e8fdf232ae50f8dc5e558252fba30336ae83b6e45e138f5b922205143d9020000006441bcf1bd79e139931c9132b72f184223573169367e12bedf407a83b02ab743449f5f7bab144f1ac6514e7cdcab644a4d84e93aeccb26328ce29a860b565a781732412102f706e233e38f92c854093350cca74f03989ade992cad5e9c2f37fd3591e2a745feffffff09e43bbe31136a69856a1d82b18e43be2f6654bb5ed34e762142c003da70ad3a020000006441b8f2c9216c68831c87f59706180f6370c7058e55dc7e566879cbc72b539b44a686a3f0a86f84e190d56498ff303135a1167e1bafbbe218a670ca3ae822d3063f4121023d538f5640dbcb1bca0cab14d9eacf19fb6558ab884aaaf5fa18268eccda8e1afeffffff79fd9c6d020ff90625ede1eca3d63836f11e6a774e022f306cf260b5a20fe077010000006441a4d16b13aa4a8ce8648872359cdcd56c6652280d4514f12be1362fa2a49c619a948c96f18b8d0f15d8b042e65315cf0f84dca2912430357f53cc6bb198d944324121027f76d0cef47d1ca5480fb61475b8a8dda3c150db24e7878e5054a2677f68ed09feffffff3f916feaac6fd543f2b4c1a0bd0cf8cdd67a051d9148b983ff89651cae6448a8010000006441e9e66ad5228bf7cea1be41a0b9cc0abc14fb533751cadd56d925be167f6dd130e608c94d6554059c8651d5814067390f705a7d4febb4e5d43ce2992ec048da45412102c4abc5997c7e1dad05fd8bacd51e5124e6f45c4956dc5cf81cd05af2b30a2a71feffffffb04c1d306f823540686c02899bfcc343e10537be36006b372885bf176b37e68a01000000644105934999a2b5b08469d91a44657353e43a3537a26ecfb85302d9109833b709f7cf6772273357cbbdfa94e1c98f010307ea42e31e6f66f5d01ebe387298ed30774121028cdd539d1c2ebe21e712121928a0e9f1244038cffaf88dd3f646a93f6e1babaffeffffff7fb42e8fdf232ae50f8dc5e558252fba30336ae83b6e45e138f5b922205143d9030000006441bbff4b3a6cb5b616a28210f4c6a07b92ca3c2d483f7f85439e8761a037ba725ea6ac164b36c1ab6f172635d4fbb8792a52f2b4bed5c40b8f5aa1305180f42866412103a08f93fed637daf62c1663c634d9034a2bfb6631c9f6ceba0c2ea7099c17fae2feffffff030000000000000000376a04534c500001010453454e4420c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca47908000000000000019522020000000000001976a91446e33d57e44125f02fc71a754fff13317ee8fc5088acb10f0000000000001976a9149c22bf7f6bb779237b2318dcbb1272f39a02d52e88accd2d0900";

// valid, but we call it invalid becuase it burns 5 tokoshis (valid inputs > outputs)
const txn = "01000000067fb42e8fdf232ae50f8dc5e558252fba30336ae83b6e45e138f5b922205143d9020000006441bcf1bd79e139931c9132b72f184223573169367e12bedf407a83b02ab743449f5f7bab144f1ac6514e7cdcab644a4d84e93aeccb26328ce29a860b565a781732412102f706e233e38f92c854093350cca74f03989ade992cad5e9c2f37fd3591e2a745feffffff09e43bbe31136a69856a1d82b18e43be2f6654bb5ed34e762142c003da70ad3a020000006441b8f2c9216c68831c87f59706180f6370c7058e55dc7e566879cbc72b539b44a686a3f0a86f84e190d56498ff303135a1167e1bafbbe218a670ca3ae822d3063f4121023d538f5640dbcb1bca0cab14d9eacf19fb6558ab884aaaf5fa18268eccda8e1afeffffff79fd9c6d020ff90625ede1eca3d63836f11e6a774e022f306cf260b5a20fe077010000006441a4d16b13aa4a8ce8648872359cdcd56c6652280d4514f12be1362fa2a49c619a948c96f18b8d0f15d8b042e65315cf0f84dca2912430357f53cc6bb198d944324121027f76d0cef47d1ca5480fb61475b8a8dda3c150db24e7878e5054a2677f68ed09feffffff3f916feaac6fd543f2b4c1a0bd0cf8cdd67a051d9148b983ff89651cae6448a8010000006441e9e66ad5228bf7cea1be41a0b9cc0abc14fb533751cadd56d925be167f6dd130e608c94d6554059c8651d5814067390f705a7d4febb4e5d43ce2992ec048da45412102c4abc5997c7e1dad05fd8bacd51e5124e6f45c4956dc5cf81cd05af2b30a2a71feffffffb04c1d306f823540686c02899bfcc343e10537be36006b372885bf176b37e68a01000000644105934999a2b5b08469d91a44657353e43a3537a26ecfb85302d9109833b709f7cf6772273357cbbdfa94e1c98f010307ea42e31e6f66f5d01ebe387298ed30774121028cdd539d1c2ebe21e712121928a0e9f1244038cffaf88dd3f646a93f6e1babaffeffffff7fb42e8fdf232ae50f8dc5e558252fba30336ae83b6e45e138f5b922205143d9030000006441bbff4b3a6cb5b616a28210f4c6a07b92ca3c2d483f7f85439e8761a037ba725ea6ac164b36c1ab6f172635d4fbb8792a52f2b4bed5c40b8f5aa1305180f42866412103a08f93fed637daf62c1663c634d9034a2bfb6631c9f6ceba0c2ea7099c17fae2feffffff030000000000000000376a04534c500001010453454e4420c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca47908000000000000019022020000000000001976a91446e33d57e44125f02fc71a754fff13317ee8fc5088acb10f0000000000001976a9149c22bf7f6bb779237b2318dcbb1272f39a02d52e88accd2d0900";

(async () => {
    console.time("SLP-VALIDATE-RPC");
    const connectionString = `http://${RPC_USER_NAME}:${RPC_PASSWORD}@${RPC_URL}`;
    const rpc = new RpcClient(connectionString);
    const slpValidator = new ValidatorType1({ getRawTransaction: async (txid) => await rpc.getRawTransaction(txid) });
    console.log("This may take a several seconds...");
    let isValid;
    try {
        isValid = await slpValidator.isValidSlpTxn({ txn, burnQuantity: Big(0) });
    } catch (error) {
        console.log(error);
        isValid = false;
    }
    console.log("Final Result:", isValid);
    console.log("NOTE: THIS IS A VALID SLP TRANSACTION, BUT WE CALL IT INVALID SINCE IT WAS BURNING INPUTS.");
    console.timeEnd("SLP-VALIDATE-RPC");
})();
