#!/bin/bash
Xvfb :1 -screen 0 1024x768x16 -ac &
usr/bin/chromedriver --whitelisted-ips="" --verbose --port=4444