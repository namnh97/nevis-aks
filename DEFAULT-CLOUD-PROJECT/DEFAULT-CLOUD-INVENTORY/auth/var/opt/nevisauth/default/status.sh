#!/bin/bash

# remember current position in log
LINES=0
if [ -f /var/opt/nevisauth/default/log/esauth4sv.log ]; then
  LINES=$(wc -l /var/opt/nevisauth/default/log/esauth4sv.log)
fi

# 1st param for timeout in second
# 2nd param for check command
wait() {
  TIMEOUT=$1
  CMD=$2

  _waitInterval=10
  _waitMax=$TIMEOUT
  _waitTime=0
  status=1
  while [ $_waitTime -lt $_waitMax ]; do
    if [[ `eval $CMD` -eq 0 ]]; then
      sleep $_waitInterval
      _waitTime=$((_waitTime + _waitInterval))
    else
      status=0
      break;
    fi
  done

  if [ $status -ne 0 ]; then
    echo "$ERR_MSG"
    return 1
  fi

  return 0
}

# wait at most 20 seconds for the log to appear
wait 20 "ls /var/opt/nevisauth/default/log/esauth4sv.log >> /dev/null 2>&1 && echo 1"

if [ $? != 0 ]; then
  echo "timeout (20s) reached waiting for nevisAuth log."
  exit 1
fi

# wait at most 70 seconds for status message in log
wait 70 "tail -n +$LINES /var/opt/nevisauth/default/log/esauth4sv.log | grep -q 'Authentication services initialized' && echo 1"

if [ $? != 0 ]; then
  echo "timeout (70s) reached waiting for nevisAuth startup."
    # show last ERROR messages from log
  tail -n -10 /var/opt/nevisauth/default/log/esauth4sv.log | grep ERROR
  exit 2
fi

# wait for port to be taken
wait 20 "2>/dev/null>/dev/tcp/0.0.0.0/8991 && echo 1"

if [ $? != 0 ]; then
  echo "timeout (20s) reached waiting for nevisAuth (https://0.0.0.0:8991)"
  # show last ERROR messages from log
  tail -n -10 /var/opt/nevisauth/default/log/esauth4sv.log | grep ERROR
  exit 3
fi