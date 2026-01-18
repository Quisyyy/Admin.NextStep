// ============================================================================
// SECURITY BEST PRACTICES - API Keys
// ============================================================================

/**
 * DO's and DON'Ts for Supabase API Keys
 */

// ✅ DO THIS - Publishable Key in Frontend
window.SUPABASE_URL = 'https://axekvziluiiessaawvol.supabase.co';
window.SUPABASE_ANON_KEY = 'sb.pub1IaablE_wm7pHvY...'; // Safe - this is the Anon key

// ❌ NEVER DO THIS - Secret Key in Frontend
// window.SUPABASE_SECRET_KEY = 'sb.secret_3i23p...'; // WRONG! Never expose!

// ============================================================================
// Security Rules
// ============================================================================

/**
 * 1. ANON KEY (Publishable Key) - Safe for Frontend ✅
 *    - Use in: JavaScript, React, Vue, Angular, browser code
 *    - Risk Level: LOW (protected by RLS)
 *    - If compromised: Attacker can only access public data + their own data
 */

/**
 * 2. SECRET KEY - Never in Frontend ❌
 *    - Use in: Node.js server, Python backend, Cloud Functions only
 *    - Risk Level: CRITICAL (full database access)
 *    - If compromised: Attacker has complete database access
 *    - Location: Environment variables on server (.env file)
 */

/**
 * 3. SERVICE ROLE KEY - Never in Frontend ❌
 *    - Use in: Admin operations on backend only
 *    - Risk Level: CRITICAL (bypasses all RLS)
 *    - If compromised: Complete access to everything
 *    - Location: Highly restricted, admin server only
 */

// ============================================================================
// Backend Example (Node.js) - Where Secret Key Goes
// ============================================================================

/*
// FILE: backend/.env (NEVER commit to git!)
SUPABASE_URL=https://axekvziluiiessaawvol.supabase.co
SUPABASE_SECRET_KEY=sb.secret_3i23p...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

// FILE: backend/server.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY  // Secret key on backend only
);

// Now you can perform admin operations
const { data, error } = await supabase
    .from('admins')
    .select('*');
*/

// ============================================================================
// What to Do If Key is Compromised
// ============================================================================

/**
 * If ANON KEY is exposed:
 * 1. Low priority (it's meant to be public)
 * 2. Monitor for suspicious activity in RLS logs
 * 3. Can optionally rotate: Supabase Settings → API Keys → Rotate
 * 
 * If SECRET KEY is exposed:
 * 1. IMMEDIATE ACTION REQUIRED 🚨
 * 2. Go to Supabase Dashboard → API Keys
 * 3. Click ⚙️ next to secret key → Rotate
 * 4. Update all backend servers with new key
 * 5. Check audit logs for suspicious access
 * 6. Review database for unauthorized changes
 */

// ============================================================================
// RLS Protection Explanation
// ============================================================================

/**
 * Row Level Security (RLS) is your first line of defense:
 * 
 * Example RLS Policy:
 * - User A's anon key can ONLY see User A's data
 * - Even if hacker gets anon key, they can't see User B's data
 * - RLS enforces this at database level
 * 
 * With Secret Key:
 * - RLS policies are BYPASSED
 * - Hacker can see ALL data
 * - That's why secret key must be protected
 */

// ============================================================================
// Your Current Setup Status
// ============================================================================

/**
 * ✅ SAFE:
 * - Anon key is hidden in Supabase dashboard (good!)
 * - You're using it in frontend code (correct!)
 * 
 * ✅ PROTECTED:
 * - Secret key is hidden with dots (good!)
 * - Secret key is NOT in frontend code (correct!)
 * 
 * ⚠️ IMPORTANT:
 * - If you use backend/API, keep secret key in .env file
 * - Never commit .env to git
 * - Use .gitignore to exclude .env
 */

// ============================================================================
// .gitignore Example (Prevent Accidentally Committing Keys)
// ============================================================================

/*
# FILE: .gitignore

# Environment variables
.env
.env.local
.env.*.local

# Node modules
node_modules/

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
*/

console.log('✅ Security guidelines loaded');
