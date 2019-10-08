{
  "name": "slp-validate",
  "version": "1.0.0",
  "description": "SLP transaction validator",
  "main": "index.js",
  "files": [
    "index.ts",
    "lib/*.js",
    "lib/*.ts",
    "dist/"
  ],
  "scripts": {
    "test": "tsc && mocha",
    "build": "tsc && mkdirp dist && browserify index.js --standalone slpvalidate > dist/slpvalidate.js && uglifyjs dist/slpvalidate.js --compress > dist/slpvalidate.min.js"
  },
  "author": "James Cramer",
  "license": "ISC",
  "dependencies": {
    "big.js": "5.2.2",
    "@types/big.js": "^4.0.5",
    "@types/node": "^12.7.5"
  },
  "devDependencies": {
    "mocha": "^5.1.1",
    "@types/mocha": "^5.1.1",
    "slp-unit-test-data": "git+https://github.com/simpleledger/slp-unit-test-data.git",
    "bitcoin-rpc-promise-retry": "^1.1.1",
    "grpc-bchrpc-node": "0.6.2",
    "grpc-slp-graphsearch-node": "^0.0.1",
    "browserify": "^16.2.2",
    "uglify-es": "^3.3.9",
    "mkdirp": "^0.5.1"
  }
}
