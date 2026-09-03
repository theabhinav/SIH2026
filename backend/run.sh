#!/bin/bash
# Free port 8001 (in case the default python runner grabbed it), then start Node/Express.
fuser -k 8001/tcp 2>/dev/null || true
sleep 1
cd /app/backend
exec node server.js
