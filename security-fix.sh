#!/bin/bash
# Security Fix Script - Run this to fix your website

echo "🔐 SECURITY FIX SCRIPT"
echo "====================="
echo ""
echo "This will help you secure your website"
echo ""

# Step 1: Database Cleanup
echo "Step 1: Cleaning up compromised database..."
echo "- Run this in Supabase SQL Editor:"
echo "- File: cleanup-compromised-database.sql"
echo ""

# Step 2: RLS Setup
echo "Step 2: Setting up secure RLS policies..."
echo "- Run this in Supabase SQL Editor:"
echo "- File: setup-secure-rls-policies.sql"
echo ""

# Step 3: API Key
echo "Step 3: REGENERATE YOUR API KEY"
echo "- Go to: https://supabase.com/dashboard"
echo "- Navigate to: Settings → API"
echo "- Click refresh icon on 'Anon' key"
echo "- Copy the new key"
echo ""

# Step 4: Environment Variables
echo "Step 4: Configure Environment Variables"
echo "- Create a .env file (or set in hosting provider):"
echo ""
echo "SUPABASE_URL=https://ziquhxrfxywsmvunuyzi.supabase.co"
echo "SUPABASE_ANON_KEY=YOUR_NEW_KEY_HERE"
echo ""

# Step 5: HTML Configuration
echo "Step 5: Add this to the TOP of your HTML files:"
echo ""
echo "<script>"
echo "  window.SUPABASE_URL = 'YOUR_URL';"
echo "  window.SUPABASE_ANON_KEY = 'YOUR_NEW_KEY';"
echo "</script>"
echo ""

# Verify Files
echo "Files Updated:"
echo "✅ supabase-client.js - Removed hardcoded keys"
echo "✅ SECURITY-FIX-GUIDE.md - Complete instructions"
echo ""
echo "Files to Run:"
echo "📄 cleanup-compromised-database.sql"
echo "📄 setup-secure-rls-policies.sql"
echo ""
echo "Next Steps:"
echo "1. Regenerate API key in Supabase Dashboard"
echo "2. Run SQL files in Supabase SQL Editor"
echo "3. Update environment variables in your hosting"
echo "4. Update HTML files with new configuration"
echo "5. Hard refresh browser (Ctrl+Shift+R)"
echo ""
echo "⚠️  NEVER commit .env files or API keys to version control!"
