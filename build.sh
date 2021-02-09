#use tar to include proto symlinks files
#tar -ch . | docker build -t dockerhub.xtdt.net:5000/xtdt/mweb-enduser:latest -
tar -ch . | docker build -t dockerhub.xtdt.net:5000/xtdt/mweb-enduser:latest -
docker push dockerhub.xtdt.net:5000/xtdt/mweb-enduser:latest
