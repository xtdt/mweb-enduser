#use tar to include proto symlinks files
tar -czh . | docker build -t dockerhub.xtdt.net:5000/xtdt/mweb-enduser:latest -
docker push dockerhub.xtdt.net:5000/xtdt/mweb-enduser:latest
