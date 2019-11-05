#!/usr/bin/env bash

ln -s ../../Electron-Cash-SLP/lib .
ln -s ../lib/slp.ts ../lib/script.ts .

../node_modules/.bin/nyc ../node_modules/.bin/ts-node ./coverage.ts

../node_modules/.bin/nyc report --reporter=html
