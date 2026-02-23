#!/bin/bash
# Get the new webhook secret
SECRET=$(stripe listen --print-secret)
# Update .env.local with the new secret
sed -i.bak "/STRIPE_WEBHOOK_SECRET=/d" .env.local
echo "STRIPE_WEBHOOK_SECRET=$SECRET" >> .env.local
# Start the listener (in the background or a new terminal)
stripe listen --forward-to localhost:3000/webhook