# determine instance name
instance=$(basename $(dirname $(dirname "$0")))

# remember position in journalctl for this unit
cursor=$(journalctl -u nevisproxy@${instance} --show-cursor | tail -1 | cut -f2- -d:)

# restart instance
systemctl restart nevisproxy@${instance} -q

# in case of failure print the journalctl starting from the cursor
if [ $? != 0 ]; then
  echo "" # new line for improved display
  journalctl -u nevisproxy@${instance} -c $cursor
  exit 1
fi

# perform additional checks
/var/opt/nevisproxy/${instance}/run/status.sh

# give up in case of failure
if [ $? != 0 ]; then
  exit 2
fi

# signal successful restart
touch /etc/nevis/nevisproxy_${instance}.yml