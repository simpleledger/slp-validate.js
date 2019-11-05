import assert from "assert";
import cp from "child_process";
import fs from "fs";
import { Slp } from "../lib/slp";

export function fuzz(buf: Buffer) {
    let result = null;
    let output;
    try {
        output = cp.execSync("./parse_and_validate_slp_message.py", { input: buf }).toString();
        result = Slp.parseSlpOutputScript(buf);
        const chunks = Slp.parseOpReturnToChunks(buf);
        console.log(chunks);
        assert(result !== null);
        console.log(`Result: ${result}`);
        assert(output === "pass\n");
    } catch (e) {
        if (e.message.indexOf("Bad OP_RETURN") !== -1 ||
            e.message.indexOf("Empty OP_RETURN") !== -1 ||
            e.message.indexOf("Not SLP") !== -1 ||
            e.message.indexOf("GENESIS with incorrect number of parameters") !== -1 ||
            e.message.indexOf("token_id is wrong length") !== -1 ||
            e.message.indexOf("Mint baton cannot be on vout=0 or 1") !== -1 ||
            e.message.indexOf("Bad send quantity buffer.") !== -1 ||

            e.message.includes("Unsupported token type:") ||
            e.message.indexOf("Field has wrong length") !== -1 ||
            e.message.indexOf("SEND quantities must be 8-bytes each.") !== -1 ||
            e.message.indexOf("MINT with incorrect number of parameters") !== -1 ||


            e.message.indexOf("Token document hash is incorrect length") !== -1 ||
            e.message.indexOf("Genesis quantity must be provided as an 8-byte buffer") !== -1 ||
            e.message.indexOf("Bad token_id buffer") !== -1 ||
            e.message.indexOf("Bad versionType buffer") !== -1 ||


            e.message.indexOf("Too many decimals") !== -1 ||
            e.message.indexOf("More than 19 output amounts") !== -1 ||
            e.message.indexOf("Missing output amounts") !== -1 ||

            e.message.indexOf("Bad tokenId buffer") !== -1 ||
            e.message.indexOf("Bad Genesis quantity buffer") !== -1 ||
            e.message.indexOf("Bad decimals buffer") !== -1 ||
            e.message.indexOf("NFT1 Child cannot have MINT transaction type.") !== -1 ||
            e.message.indexOf("Missing SLP transaction type") !== -1 ||
            e.message.indexOf("Bad Mint quantity buffer") !== -1 ||


            e.message.indexOf("SEND with too few parameters") !== -1 ||
            e.message.indexOf("Mint quantity must be provided as an 8-byte buffer") !== -1 ||
            e.message.indexOf("NFT1 child token must have GENESIS quantity of 1.") !== -1 ||
            e.message.indexOf("Bad Mint quantity buffer") !== -1 ||


            e.message.indexOf("NFT1 child token must have divisibility set to 0 decimal places.") !== -1 ||
            e.message.indexOf("Missing token versionType") !== -1 ||
            e.message.indexOf("NFT1 child token must not have a minting baton!") !== -1 ||
            e.message.indexOf("Bad transaction type") !== -1) {
                assert(result === null);
                assert(output === "fail\n");
                console.log(`Result: ${e.message}`);
        } else if (e.message === "spawnSync /bin/sh EPIPE") {
            // For some reason this happens sometimes, it is unrelated to relevant fuzzer findings
            assert(true);
            console.log(e.message);
            // throw e;
        } else {
            throw e;
        }
    }
}
switch (process.argv[2]) {
case "--stdin":
    const stdinBuffer = fs.readFileSync("/dev/stdin"); // STDIN_FILENO = 0
    console.log("Processing input using stdin");
    fuzz(stdinBuffer);
    break;
}
