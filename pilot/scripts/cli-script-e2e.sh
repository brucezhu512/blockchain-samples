#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Blockchain sample (pilot) end-to-end test"
echo

# Include base scripts holds shared functions
source $(dirname "$0")/cli-script-base.sh

# Set Global Parameters
setGlobalParams

# Create Channel by Customer 
buildChannel 'john' 'customer.com' 'CustomerMSP' 'Accident_Occurred'

# Join channel as InsurerOrg
joinChannelAsOrg 'officer assessor' 'insurer.com' 'InsurerMSP'

# Join channel as RepairerOrg
joinChannelAsOrg 'shop1' 'repairer.com' 'RepairerMSP'

# Switch to Customer 'John'
setPeerParams 'john' 'customer.com' 'CustomerMSP'

# Invoke Chaincode to given status and query to verify the result
testChaincode 'Accident_Reported'

# Switch to 'Officer'
setPeerParams 'officer' 'insurer.com' 'InsurerMSP'

# Invoke Chaincode to given status and query to verify the result
testChaincode 'Claim_Lodged'

# Switch to 'Assessor'
setPeerParams 'assessor' 'insurer.com' 'InsurerMSP'

# Invoke Chaincode to given status and query to verify the result
testChaincode 'Damage_Assessed'

# Switch to Repairer 'ra'
setPeerParams 'shop1' 'repairer.com' 'RepairerMSP'

# Invoke Chaincode to given status and query to verify the result
testChaincode 'Vechicle_Fixed'

echo
echo "========= All GOOD, end-to-end test execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0