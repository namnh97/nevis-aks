#!/bin/sh

nevis_group=nvbgroup
nevis_group_id=30000

nevis_user=nvpuser
nevis_user_id=30002

if [ -z "$(getent group "$nevis_group")" ]
then
    echo "Installing group '$nevis_group' with id '$nevis_group_id'"
    groupadd --gid "$nevis_group_id" "$nevis_group"
fi

if [ -z "$(getent passwd "$nevis_user")" ]
then
    echo "Installing user '$nevis_user' with id '$nevis_user_id'"
    useradd \
        --comment 'functional user of nevisProxy' \
        --home-dir '/opt/nevisproxy' \
        --gid "$nevis_group" \
        --uid "$nevis_user_id" \
        --shell '/sbin/nologin' \
        "$nevis_user"
fi