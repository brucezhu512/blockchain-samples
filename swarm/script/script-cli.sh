peer channel create -o orderer.example.com:7050 -c mychannel -f ./config/channel.tx

peer channel join -b mychannel.block

peer chaincode install -n fabcar -v 1.0 -p github.com/fabcar

peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n fabcar -v 1.0 -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
