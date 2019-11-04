#! /usr/bin/env python3

from json                   import loads
from lib.transaction        import Transaction
from sys                    import argv

indir = argv[1]
outdir = argv[2]

json = loads(open(indir+"/script_tests.json").read())
for i,x in enumerate(json):
    script = x['script']
    with open(outdir+"/"+str(i)+".script", 'wb') as f:
        f.write(bytes.fromhex(script))

json = loads(open(indir+"/tx_input_tests.json").read())
for i,x in enumerate(json):
    for y in x['when']:
        outs = Transaction(y['tx']).outputs()
        try:
          out = bytes.fromhex(str(outs[0][1]))
          with open(outdir+"/"+str(i)+".tx", 'wb') as f:
              f.write(out)
        except ValueError:
          pass
