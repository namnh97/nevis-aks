#!/bin/sh

EXIT_CODE=0

# service at "https://0.0.0.0:8443"
SSL=`echo | openssl s_client -connect 0.0.0.0:8443`
HC=`curl --insecure --silent --output /dev/null --write-out "%{http_code}" https://0.0.0.0:8443`
CON=$?
if [[ $SSL = *"Acceptable client certificate CA names"* ]]; then
  echo "skipped: https://0.0.0.0:8443"
elif [ "$CON" -ne 0 ]; then
  echo "down: https://0.0.0.0:8443 (exit code $CON)"
  EXIT_CODE=$CON
else
  echo "up: https://0.0.0.0:8443"
fi

exit $EXIT_CODE
