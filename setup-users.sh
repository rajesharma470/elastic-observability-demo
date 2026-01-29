#!/bin/bash

# Script to set up Kibana user for Elasticsearch
# This is required for Elasticsearch 8.x

ELASTICSEARCH_URL="http://localhost:9200"
ELASTIC_USER="elastic"
ELASTIC_PASSWORD="changeme"
KIBANA_USER="kibana_system"
KIBANA_PASSWORD="changeme"

echo "Setting up Kibana user in Elasticsearch..."

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch..."
until curl -s -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" "${ELASTICSEARCH_URL}/_cluster/health" | grep -q '"status":"green\|yellow"'; do
  echo "Waiting for Elasticsearch..."
  sleep 2
done

echo "Elasticsearch is ready!"

# Set password for kibana_system user
echo "Setting password for kibana_system user..."
curl -X POST "${ELASTICSEARCH_URL}/_security/user/${KIBANA_USER}/_password" \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" \
  -s -o /dev/null

if [ $? -eq 0 ]; then
  echo "✓ Kibana user password set successfully!"
else
  echo "✗ Failed to set Kibana user password"
  exit 1
fi

echo ""
echo "Setup complete! Kibana can now connect to Elasticsearch."
echo "Kibana credentials: ${KIBANA_USER} / ${KIBANA_PASSWORD}"
