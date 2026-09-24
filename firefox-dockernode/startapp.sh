#!/bin/bash
Xvfb :1 -screen 0 1024x768x16 -ac &
# Listen on all interfaces so the published port is reachable from the hub
exec /usr/bin/geckodriver --host 0.0.0.0 --port 4444 --allow-hosts localhost
