#!/bin/bash
set -o errexit
set -o nounset
set -o pipefail

#### Run Type Checks
export NODE_ENV="test"
# TODO: parallelize these
yarn tsc --build packages/*/tsconfig.json
yarn tsc --build apps/editing-toolkit/tsconfig.json
yarn tsc --build client/tsconfig.json
yarn tsc --build test/e2e/tsconfig.json


#### Run unit tests
# TODO: parallelize these
unset NODE_ENV
unset CALYPSO_ENV
yarn test-client --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent
yarn test-server --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent
yarn test-packages --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent
yarn test-build-tools --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent
yarn workspaces foreach --verbose --parallel run storybook --ci --smoke-test
