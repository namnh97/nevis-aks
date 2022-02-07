#!/bin/bash

# wait at most 200 seconds for the port to be open
_waitInterval=10
_waitMax=200
_waitTime=0
health_ok=1
while [ $_waitTime -lt $_waitMax ]; do
  # api to check status of nevisAuth
  if [[ `eval "2>/dev/null>/dev/tcp/0.0.0.0/8988 && echo 1"` -eq 0 ]]; then
    sleep $_waitInterval
    _waitTime=$((_waitTime + _waitInterval))
  else
    health_ok=0
    break;
  fi
done

if [ $health_ok -eq 1 ]; then
  echo "timeout (200s) reached waiting for nevisLogrend (http(s)://0.0.0.0:8988)"
  exit ${health_ok}
fi