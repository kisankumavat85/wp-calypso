#!/bin/bash
set -o errexit
set -o nounset
set -o pipefail
shopt -s nullglob

function prevent_uncommitted_changes {
	# Check for uncommitted changes
	export NODE_ENV="test"

	# Prevent uncommited changes
	DIRTY_FILES=$(git status --porcelain 2>/dev/null)
	if [ ! -z "$DIRTY_FILES" ]; then
		echo "Repository contains uncommitted changes: "
		echo "$DIRTY_FILES"
		echo "You need to checkout the branch, run 'yarn' and commit those files."
		exit 1
	fi
}

function prevent_duplicated_packages {
	# Duplicated packages
	if ! DUPLICATED_PACKAGES=$(
		set +e
		yarn dedupe --check
	); then
		echo "Repository contains duplicated packages: "
		echo ""
		echo "$DUPLICATED_PACKAGES"
		echo ""
		echo "To fix them, you need to checkout the branch, run 'yarn dedupe',"
		echo "verify that the new packages work and commit the changes in 'yarn.lock'."
		exit 1
	else
		echo "No duplicated packages found."
	fi
}

# Couple short tests:
prevent_uncommitted_changes &
prevent_duplicated_packages &
wait

#### Run Type Checks
export NODE_ENV="test"

echo "STARTING TSC"

# Find all ts config files:
ts_configs=(packages/*/tsconfig.json)
ts_configs+=(apps/editing-toolkit/tsconfig.json)
ts_configs+=(client/tsconfig.json)
ts_configs+=(test/e2e/tsconfig.json)

for config in "${ts_configs[@]}"; do
	echo "Starting tsc for $config..."
	yarn tsc --build $config &
done

# Waits for all tsc background jobs to finish
wait
echo "DONE WITH ALL TSC"

#### Run unit tests
unset NODE_ENV
unset CALYPSO_ENV

# Run this suite by itself, since it's very large.
yarn test-client --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent

# Run these in parallel, since they're smaller.
yarn test-server --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent &
yarn test-packages --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent &
yarn test-build-tools --maxWorkers=$JEST_MAX_WORKERS --ci --reporters=default --reporters=jest-teamcity --silent &
yarn workspaces foreach --verbose --parallel run storybook --ci --smoke-test &

wait
