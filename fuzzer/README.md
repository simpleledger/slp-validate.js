# Validator Differential Fuzzer

Trail of Bits security audit has included a differential fuzzer test that uses [jsfuzz](https://github.com/fuzzitdev/jsfuzz), an in-process, coverage-guided, evolutionary fuzzing engine based on [libFuzzer](https://llvm.org/docs/LibFuzzer.html). 
Our differential fuzzer script uses a two-step procedure: 

1. Parses and validates an SLP message using the TypeScript validator (using the  `parseSlpOutputScript` function) and the Python validator (using an external script). 
2. Compares the outcome of both: the same message should be rejected or accepted by both validators.

If there is a discrepancy in the outcome, we conclude that at least one of the validators is incorrectly implemented. Any unhandled exception or crash will be reported as well. 

## Getting started

Make sure Electron Cash SLP edition is installed into the same directory as `slp-validate`:

```
$ git clone https://github.com/simpleledger/Electron-Cash-SLP.git`
$ cd ./slp-validate/fuzzer
$ ln -s ../../Electron-Cash-SLP/lib .
```

To start a fuzzing campaign using the `corpus` directory to store the input files: 

```
$ mkdir -p corpus
$ python3 ./extract_data_from_unit_test.py ./node_modules/slp-unit-test-data ./corpus
$ tsc
$ ./node_modules/.bin/jsfuzz dfuzz.js corpus
```

The fuzzer will automatically stop if it finds an issue. For instance:

```
...
{ AssertionError [ERR_ASSERTION]: false == true
    at Worker.fuzz [as fn] (diff-fuzzer/dfuzz.js:1:5181)
    at process.on (diff-fuzzer/node_modules/jsfuzz/build/src/worker.js:45:30)
    at process.emit (events.js:182:13)
    at emit (internal/child_process.js:812:12)
    at process._tickCallback (internal/process/next_tick.js:63:19)
  generatedMessage: true,
  name: 'AssertionError [ERR_ASSERTION]',
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==' }
crash was written to crash-3028d59a1dcddd53cb020e0de173ea10abfa54ff2e5c570ea0a9c619d5c7d609
crash(hex)=6a04534c50000101044d494e5420ffffffffffffffffffffffff7fffffffffffffffffffffffffffffffffffffff01ff080000000000000064
```

The dfuzz.js can be also used to test a single output:

```
$ cat input | node dfuzz.js --stdin
```
