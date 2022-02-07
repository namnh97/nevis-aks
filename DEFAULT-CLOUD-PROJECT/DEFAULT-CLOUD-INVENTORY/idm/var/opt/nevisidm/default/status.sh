#!/bin/bash
#
# NAME
#     status.sh - Checks the status of the nevisIDM Service.
#
# SYNOPSIS
#     status.sh
#
# DESCRIPTION
#     Performs periodic checks until the service is up or broken or timeout is reached.
#     The script terminates when the process of the service stops running.
#     There are no arguments for this script.
#
# EXIT CODES
#  0    Service is up.
#  1    Service process is not running.
#  2    Service is broken.
#  3    Timeout reached.

# Defines how much we should sleep between checking if the service is up.
interval=1
# Defines how much we should wait the service to start up until we give up and exit.
timeout=180
((end_time=${SECONDS}+$timeout))

# Checks if the process of the service is still running.
# Arguments:
#   None
# Returns:
#   In case it is running, returns 0, otherwise non-zero (exit code of systemctl).
isProcessRunning() {
  systemctl is-active --quiet nevisidm@default
  IS_RUNNING=$?
  return $IS_RUNNING
}

# Checks if the readiness (/health) management endpoint can be used for checking status.
# (nevisIDM introduced the readiness (/health) management endpoint in 2.73.1.15 version.)
# Arguments:
#   None
# Returns:
#   If the nevisIDM version is at least 2.73.1.15, returns 0.
#   Otherwise returns 1.
canHealthCheckUsed() {
  minimal=2.73.1.15
  installed=`readlink -f /opt/nevisidm/bin | awk -F'/' '{print $4}' | sed 's/rc.*//'`

  if [ "$installed" = "`echo -e "$installed\n$minimal" | sort -V | tail -n1`" ]; then
    return 0
  else
    return 1
  fi
}

# Checks if the service is up.
# Based on nevisIDM version uses different nevisIDM endpoints.
# Arguments:
#   None
# Returns:
#   The result of ServiceCheck function.
checkService() {
  if canHealthCheckUsed; then
    doServiceCheckHealth
    return $?
  else
    doServiceCheckOld
    return $?
  fi
}

# Checks if the service is up. (Attempts connecting the service with curl.)
# In case the service is broken, exits with exit code 2.
# Arguments:
#   None
# Returns:
#   If the connection was successful and the service up (is not broken), returns 0.
#   If the connection was not successful, returns the curl exit code.
doServiceCheckOld() {
  HC=`curl --insecure --silent --output /dev/null --write-out "%{http_code}" https://idm:8989/nevisidm/admin/`
  CON=$?

  if [ "$CON" -ne 0 ]; then
    EXIT_CODE=$CON
  elif [ $HC -ge 500 ]; then
    echo "Service is broken (HTTP code $HC)."
    exit 2
  else
    EXIT_CODE=0
  fi

  return $EXIT_CODE
}

# Checks if the service is up. (Attempts connecting the service with curl.)
# Note: With the health check endpoint there is no way fail early when the endpoint returns HTTP 503, because it can come up
# later and then return HTTP 200.
# Arguments:
#   None
# Returns:
#   If the connection was successful and the service up (is not broken), returns 0.
#   If the connection was not successful, returns 1.
doServiceCheckHealth() {
  HC=`curl --silent --output /dev/null --write-out "%{http_code}" http://0.0.0.0:8998/health`
  CON=$?

  if [ $HC -eq 200 ]; then
    EXIT_CODE=0
  else
    EXIT_CODE=1
  fi

  return $EXIT_CODE
}

# This function encapsulates the logic of checking if the process is running and if the service is up.
# In case the process is not running, exits with exit code 1.
# Arguments:
#   None
# Returns:
#   If the service process is running, returns the result of the service check function.
check() {
 if isProcessRunning
  then
    checkService
    CS=$?
    return $CS
  else
    echo "Process is not running."
    exit 1
  fi
}

# Check the status of the service periodically.
while ((${SECONDS} < ${end_time}))
do
  sleep ${interval}
  if check
  then
    echo "Service is up."
    exit 0
  fi
done

echo "Exceeded check timeout (${timeout}s). Service is down."
exit 3