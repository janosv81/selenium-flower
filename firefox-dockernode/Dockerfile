FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1

# Firefox runtime libraries (Ubuntu's own firefox package is a snap wrapper)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates curl jq xz-utils bzip2 xvfb procps net-tools nano \
     libgtk-3-0t64 libasound2t64 libdbus-glib-1-2 libx11-xcb1 libxtst6 \
     libpci3 fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

#=========
# Firefox
#=========
# "latest" resolves at build time; pin with --build-arg FIREFOX_VERSION=<version>.
ARG FIREFOX_VERSION=latest
RUN FF_VERSION=$FIREFOX_VERSION \
  && if [ "$FF_VERSION" = "latest" ]; then \
       FF_VERSION=$(curl -fsSL https://product-details.mozilla.org/1.0/firefox_versions.json | jq -r .LATEST_FIREFOX_VERSION); \
     fi \
  && FF_URL=https://download-installer.cdn.mozilla.net/pub/firefox/releases/$FF_VERSION/linux-x86_64/en-US/firefox-$FF_VERSION \
  && echo "Firefox $FF_VERSION" \
  && rm -rf /opt/firefox \
  && if curl -fsSL -o /tmp/firefox.tar.xz $FF_URL.tar.xz; then \
       tar -C /opt -xJf /tmp/firefox.tar.xz; \
     else \
       curl -fsSL -o /tmp/firefox.tar.bz2 $FF_URL.tar.bz2 && tar -C /opt -xjf /tmp/firefox.tar.bz2; \
     fi \
  && rm -f /tmp/firefox.tar.* \
  && mv /opt/firefox /opt/firefox-$FF_VERSION \
  && ln -fs /opt/firefox-$FF_VERSION/firefox /usr/bin/firefox

#============
# GeckoDriver
#============
# "latest" resolves at build time; pin with --build-arg GECKODRIVER_VERSION=<version>.
ARG GECKODRIVER_VERSION=latest
RUN GD_VERSION=$GECKODRIVER_VERSION \
  && if [ "$GD_VERSION" = "latest" ]; then \
       GD_VERSION=$(curl -fsSL https://api.github.com/repos/mozilla/geckodriver/releases/latest | jq -r .tag_name | sed 's/^v//'); \
     fi \
  && echo "geckodriver $GD_VERSION" \
  && curl -fsSL -o /tmp/geckodriver.tar.gz https://github.com/mozilla/geckodriver/releases/download/v$GD_VERSION/geckodriver-v$GD_VERSION-linux64.tar.gz \
  && tar -C /tmp -zxf /tmp/geckodriver.tar.gz \
  && install -D -m 0755 /tmp/geckodriver /opt/geckodriver-$GD_VERSION \
  && ln -fs /opt/geckodriver-$GD_VERSION /usr/bin/geckodriver \
  && rm -f /tmp/geckodriver.tar.gz /tmp/geckodriver

COPY startapp.sh /startapp.sh
RUN chmod 755 /startapp.sh
EXPOSE 4444
EXPOSE 5900
CMD ["/startapp.sh"]
