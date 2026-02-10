#!/bin/sh
# Generate env-config.js file with environment variables
# This allows handling environment variables at runtime in a static site

echo "window.env = {" > /usr/share/nginx/html/env-config.js
echo "  \"VITE_SUPABASE_URL\": \"$VITE_SUPABASE_URL\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_SUPABASE_ANON_KEY\": \"$VITE_SUPABASE_ANON_KEY\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_SUPABASE_SERVICE_ROLE_KEY\": \"$VITE_SUPABASE_SERVICE_ROLE_KEY\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_GOOGLE_MAPS_API_KEY\": \"$VITE_GOOGLE_MAPS_API_KEY\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_APP_NAME\": \"$VITE_APP_NAME\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_APP_VERSION\": \"$VITE_APP_VERSION\"," >> /usr/share/nginx/html/env-config.js
echo "  \"VITE_NODE_ENV\": \"$VITE_NODE_ENV\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

echo "Generated env-config.js with runtime variables."
