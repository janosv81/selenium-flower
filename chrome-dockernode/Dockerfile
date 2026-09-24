FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates curl gnupg unzip xvfb procps net-tools nano \
  && rm -rf /var/lib/apt/lists/*

#========
# Chrome
#========
RUN install -d -m 0755 /etc/apt/keyrings \
  && curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub \
     | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
  && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
     > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

#==============
# ChromeDriver
#==============
# Matches the installed Chrome version by default (Chrome for Testing).
# Override with --build-arg CHROME_DRIVER_VERSION=<full version>.
ARG CHROME_DRIVER_VERSION="auto"
RUN CFT=https://storage.googleapis.com/chrome-for-testing-public \
  && CHROME_VERSION=$(google-chrome --version | grep -oE '[0-9]+(\.[0-9]+){3}') \
  && if [ "$CHROME_DRIVER_VERSION" = "auto" ]; then CD_VERSION=$CHROME_VERSION; else CD_VERSION=$CHROME_DRIVER_VERSION; fi \
  && if ! curl -fsSL -o /tmp/chromedriver.zip $CFT/$CD_VERSION/linux64/chromedriver-linux64.zip; then \
       CD_VERSION=$(curl -fsSL https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${CHROME_VERSION%%.*}) \
       && curl -fsSL -o /tmp/chromedriver.zip $CFT/$CD_VERSION/linux64/chromedriver-linux64.zip; \
     fi \
  && echo "Chrome $CHROME_VERSION, chromedriver $CD_VERSION" \
  && unzip -q /tmp/chromedriver.zip -d /tmp \
  && install -D -m 0755 /tmp/chromedriver-linux64/chromedriver /opt/selenium/chromedriver-$CD_VERSION \
  && ln -fs /opt/selenium/chromedriver-$CD_VERSION /usr/bin/chromedriver \
  && rm -rf /tmp/chromedriver.zip /tmp/chromedriver-linux64

EXPOSE 4444
COPY startapp.sh /startapp.sh
RUN chmod 755 /startapp.sh
CMD ["/startapp.sh"]
