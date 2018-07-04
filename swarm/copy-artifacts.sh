docker-machine ssh vmgr mkdir -p fabcar-swarm
docker-machine scp -r -q ./ vmgr:/home/docker/fabcar-swarm/

docker-machine ssh vbox1 mkdir -p fabcar-swarm
docker-machine scp -r -q ./ vbox1:/home/docker/fabcar-swarm/

docker-machine ssh vbox2 mkdir -p fabcar-swarm
docker-machine scp -r -q ./ vbox2:/home/docker/fabcar-swarm/