#!/bin/bash

function printAndRun() {
  echo "# COMMAND: $1"
  eval $1
}

node app.js &
sleep 3

export CLAIM_KEY='claim-http-e2e'

echo ''
printAndRun "curl -X POST http://localhost:4000/peer/customer/claims/$CLAIM_KEY/Accident-Reported"
echo ''
echo ''
printAndRun "curl -X POST http://localhost:4000/peer/officer/claims/$CLAIM_KEY/Claim-Lodged"
echo ''
echo ''
printAndRun "curl -X POST http://localhost:4000/peer/assessor/claims/$CLAIM_KEY/Damage-Assessed"
echo ''
echo ''
printAndRun "curl -X POST http://localhost:4000/peer/repairer/claims/$CLAIM_KEY/Vehicle-Fixed"
echo ''
echo ''