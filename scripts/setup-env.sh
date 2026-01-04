#!/bin/bash

# Signalstack Environment Setup Script
# Run this script to create your .env.local file with required environment variables

ENV_FILE=".env.local"

echo "🚀 Signalstack Environment Setup"
echo "================================="
echo ""

# Check if .env.local already exists
if [ -f "$ENV_FILE" ]; then
    read -p "⚠️  $ENV_FILE already exists. Overwrite? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. No changes made."
        exit 1
    fi
fi

# Generate a random secret for NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

# Create the .env.local file
cat > "$ENV_FILE" << EOF
# ============================================
# Signalstack Environment Configuration
# ============================================

# MongoDB Connection
# For local MongoDB, use: mongodb://localhost:27017/signalstack
# For MongoDB Atlas, use your connection string
MONGODB_URI=mongodb://localhost:27017/signalstack

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional - for Phase 0, this is skipped)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Stripe (for Phase 5 - Billing)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF

echo "✅ Created $ENV_FILE successfully!"
echo ""
echo "📋 Configuration:"
echo "   - MongoDB URI: mongodb://localhost:27017/signalstack"
echo "   - NextAuth Secret: (auto-generated)"
echo "   - NextAuth URL: http://localhost:3000"
echo ""
echo "🔧 Next steps:"
echo "   1. Make sure MongoDB is running locally"
echo "   2. Run 'npm run dev' to start the application"
echo ""
