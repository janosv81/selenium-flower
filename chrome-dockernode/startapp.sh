#!/bin/bash
Xvfb :1 -screen 0 1024x768x16 -ac &
exec /usr/bin/chromedriver --allowed-ips= --port=4444 --verbose
