#! /usr/bin/env python3

from lib.slp_validator_0x01       import Validator_SLP1
from lib.slp_validator_0x01_nft1  import Validator_NFT1
from lib.transaction        import Transaction
from lib.address            import Address, ScriptOutput, ScriptError
from lib.bitcoin            import TYPE_SCRIPT, TYPE_ADDRESS
from lib.slp                import SlpMessage, SlpInvalidOutputMessage, SlpUnsupportedSlpTokenType 
from sys                    import stdin, exit

val = Validator_SLP1(None, enforced_token_type=None)
val_nft = Validator_NFT1(None, None)

stdin_compat = stdin.buffer
inputs = [{'prevout_hash': '08ac530c0a70b641083689b2679ed131a933963119242df0b9bff64d7ea7b44c', 'prevout_n': 1, 'sequence': 0, 'address': None, 'x_pubkeys': [], 'pubkeys': [], 'signatures': {}, 'type': 'unknown', 'num_sig': 0, 'scriptSig': ''}]

out = (TYPE_ADDRESS, Address.from_string("qz4242424242424242424242424242424gl8s99lzw"), 546)

inp = stdin_compat.read(2048)
script = ScriptOutput(inp)
t = Transaction.from_io(inputs, [(TYPE_SCRIPT, script, 0), out])
ret = val.get_info(t)

if len(ret) == 2:
    ret = val_nft.get_info(t) 
    if len(ret) == 2:
        print("fail")
    else:
        print("pass")
else:
    print("pass")

exit(0)

