#!/bin/bash -x

# NOTE: This script is public.

# Switch to root
sudo -i

export START_SCRIPT_FILE="START_SCRIPT.sh"

# NOTE: We assume start script has already run on startup, and jq is installed.
# sudo apt-get -y install jq

# Get the access token for the bucket access
export OAUTH2_TOKEN=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" -H "Metadata-Flavor: Google" | jq -r '.access_token')

# Get the script from the bucket
eval 'curl -X GET \
  -H "Authorization: Bearer $OAUTH2_TOKEN" \
  -o "$START_SCRIPT_FILE" \
  "https://www.googleapis.com/storage/v1/b/deadbool-startup-script/o/$START_SCRIPT_FILE?alt=media"'

# Run the script
if [ -f $START_SCRIPT_FILE ]; then
  chmod 777 $START_SCRIPT_FILE
  source $START_SCRIPT_FILE
else
  echo "ERROR!! The start script download failed."
fi
