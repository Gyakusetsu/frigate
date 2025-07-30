#!/usr/bin/env bash

node -v
npm -v
npm install
npm run build && mv dist/monacoeditorwork/* dist/assets/
