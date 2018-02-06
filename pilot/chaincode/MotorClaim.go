package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type ClaimStatus struct {
}

func (t *ClaimStatus) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Motor Claims Assessment Chaincode Init ...")
	_, args := stub.GetFunctionAndParameters()
	Claim := args[0]
	Status := args[1]

	StatusBytes, _ := stub.GetState(Claim)
	if StatusBytes == nil {
		return updateClaim(stub, Claim, Status)
	}

	return shim.Success(nil)
}

func (t *ClaimStatus) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Motor Claims Assessment Chaincode Invoke ...")
	function, args := stub.GetFunctionAndParameters()
	if function == "update" {
		return t.update(stub, args)
	} else if function == "close" {
		return t.close(stub, args[0])
	} else if function == "query" {
		return t.query(stub, args[0])
	}

	return shim.Error("Invalid invoke function name. Expecting \"update\" \"close\" \"query\"")
}

func (t *ClaimStatus) update(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return updateClaim(stub, args[0], args[1])
}

// Update claim to the given status
func updateClaim(stub shim.ChaincodeStubInterface, Claim string, Status string) pb.Response {
	fmt.Println("Motor Claims Assessment Chaincode ... update claim " + Claim + " to " + Status)

	// Write the state to the ledger
	var err = stub.PutState(Claim, []byte(Status))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// Close a claim and remove it from ledger database
func (t *ClaimStatus) close(stub shim.ChaincodeStubInterface, Claim string) pb.Response {
	fmt.Println("Motor Claims Assessment Chaincode ... close claim " + Claim)

	// Delete the key from the state in ledger
	err := stub.DelState(Claim)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// query callback representing the query of a chaincode
func (t *ClaimStatus) query(stub shim.ChaincodeStubInterface, Claim string) pb.Response {
	// Get the state from the ledger
	StatusBytes, err := stub.GetState(Claim)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get status for " + Claim + "\"}"
		return shim.Error(jsonResp)
	}

	if StatusBytes == nil {
		jsonResp := "{\"Error\":\"Nil status for " + Claim + "\"}"
		return shim.Error(jsonResp)
	}

	jsonResp := "{\"Claim\":\"" + Claim + "\",\"Status\":\"" + string(StatusBytes) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return shim.Success(StatusBytes)
}

func main() {
	err := shim.Start(new(ClaimStatus))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
