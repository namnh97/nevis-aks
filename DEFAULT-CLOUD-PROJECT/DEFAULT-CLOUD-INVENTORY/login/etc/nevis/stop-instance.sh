#!/bin/bash

id=$1

# find latest instance description file for this ID
latest=$(ls -1rt /etc/nevis/*.yml | xargs grep -l "${id}" | tail -1)

if [ ! -r "${latest}" ]; then
  # instance description does not exist - cannot stop instance
  exit 0 # ignore this error silently
fi

# get latest stop command
stop_command=$(grep stop "$latest" | cut -d '"' -f2)

# run command
$stop_command