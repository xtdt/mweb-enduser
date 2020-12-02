FROM dockerhub.xtdt.net:5000/xtdt/mweb-base:latest
RUN apk add --no-cache tzdata \
    &&ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    &&echo 'Asia/Shanghai' >/etc/timezone
ADD . /
WORKDIR "/"
CMD ["node","app.js"]
