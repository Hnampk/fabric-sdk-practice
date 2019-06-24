docker-compose down
docker rm $(docker ps -aq)
docker volume prune
