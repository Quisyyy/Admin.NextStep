# Supabase RLS Integration - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Web Browser                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTML Forms (Login, Register, etc.)                            │
│       │                                                          │
│       ▼                                                          │
│  JavaScript Event Handlers                                     │
│  (admin-login.js, admin-register.js)                          │
│       │                                                          │
│       ▼                                                          │
│  DatabaseHelper Library  ◄── Central Database Interface       │
│  (db-helper.js)                                                │
│       │                                                          │
│       ▼                                                          │
│  Supabase Client  ◄── Authentication & API Calls             │
│  (supabase-client.js)                                         │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │ HTTPS/WebSocket
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Cloud (Your Project)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Authentication Service                                        │
│  (Passwords hashed, Sessions managed)                         │
│       │                                                          │
│       ▼                                                          │
│  RLS Policy Engine  ◄── Enforces Access Control               │
│  (5 Policies)          at Database Level                      │
│       │                                                          │
│       ▼                                                          │
│  PostgreSQL Database                                          │
│  ┌────────────────────┐                                        │
│  │ admins table       │                                        │
│  │ ┌────────────────┐ │                                        │
│  │ │ id (UUID)      │ │  Row Level Security                   │
│  │ │ email          │ │  enforces on every                   │
│  │ │ employee_id    │ │  query automatically                 │
│  │ │ full_name      │ │                                        │
│  │ │ role           │ │                                        │
│  │ │ created_at     │ │                                        │
│  │ │ updated_at     │ │                                        │
│  │ └────────────────┘ │                                        │
│  └────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Registration

```
┌─────────────────────────────────────────────────────────────────┐
│ User fills registration form:                                  │
│ - Full Name                                                     │
│ - Employee ID                                                   │
│ - Email                                                         │
│ - Password                                                      │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Browser event: Form submit                                     │
│ Called: handleCreateAccount()                                  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ DatabaseHelper.registerAdmin(                                  │
│   email, password, fullName, employeeId                       │
│ )                                                               │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─────────────────────┬─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Validate inputs  │ │ Check if emp_id  │ │ Ensure DB ready  │
│ (required, etc)  │ │ already exists   │ │ (timeout check)  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ All validation passed                   │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Supabase Auth: Create user account                      │
        │ - Sends email + password to Supabase                   │
        │ - Password hashed with bcrypt                          │
        │ - User ID generated (UUID)                             │
        │ - Session token created                                │
        └─────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Database: Insert into admins table                      │
        │ - id: (matches auth user ID)                           │
        │ - employee_id: "EMP001"                                │
        │ - email: "admin@example.com"                           │
        │ - full_name: "Admin Name"                              │
        │ - role: "admin"                                         │
        │ - created_at: now()                                    │
        │ - updated_at: now()                                    │
        │                                                         │
        │ ✓ RLS Policy CHECK:                                    │
        │   "admins_insert" policy checks:                       │
        │   auth.uid() = id  (User creating own record)          │
        │   ✓ ALLOWED                                             │
        └─────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ Success! Account created                │
        │ Redirect to login page                  │
        └─────────────────────────────────────────┘
```

---

## Data Flow: User Login

```
┌─────────────────────────────────────────────────────────────────┐
│ User fills login form:                                         │
│ - Employee ID                                                   │
│ - Password                                                      │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Browser event: Form submit                                     │
│ Called: handleLogin()                                          │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ DatabaseHelper.loginAdmin(employeeId, password)               │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Resolve Employee ID → Email                            │
│                                                                  │
│ Query: SELECT email FROM admins                                │
│        WHERE employee_id = "EMP001"                            │
│                                                                  │
│ ✓ RLS Policy CHECK:                                            │
│   "admins_select_own" policy checks:                           │
│   auth.uid() = id  (User reading own record)                   │
│   ✗ NOT ALLOWED (user not authenticated yet)                   │
│                                                                  │
│   But "admins_select_all" policy checks:                       │
│   User has role='admin'                                        │
│   ✗ NOT ALLOWED (user not admin yet)                           │
│                                                                  │
│   ⚠️ This query needs different access...                      │
│   Actually, we check if ANY admin has this employee_id         │
│   (This is allowed for registration flow)                      │
│                                                                  │
│ Result: "admin@example.com"                                    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Sign in with Email + Password                          │
│                                                                  │
│ Supabase Auth.signInWithPassword({                             │
│   email: "admin@example.com",                                  │
│   password: "SecurePassword123"                                │
│ })                                                              │
│                                                                  │
│ - Looks up user by email                                       │
│ - Hashes provided password                                     │
│ - Compares with stored hash                                    │
│ - If match: Creates session token                              │
│ - If no match: Returns error                                   │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─ If success ────────────────────────────────────────┐
        │                                                      │
        ▼                                                      ▼
   SUCCESS                                                 ERROR
   ✓ Session created                                   ✗ Invalid password
   ✓ User ID stored locally                           ✗ Try again
   ✓ Redirect to dashboard
```

---

## RLS Policy Enforcement

```
Every database query goes through this process:

┌─────────────────────────────────────────┐
│ JavaScript sends query to Supabase      │
│                                          │
│ Example:                                │
│ SELECT * FROM admins WHERE id = '...'  │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Supabase receives request                                      │
│ - Identifies authenticated user (from session token)           │
│ - Gets user's role and ID                                      │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ RLS Policy Engine checks applicable policies                   │
│                                                                  │
│ For SELECT query, check these policies in order:               │
│ 1. "admins_select_own"   → auth.uid() = id                    │
│ 2. "admins_select_all"   → User has role='admin'              │
│                                                                  │
│ If ANY policy allows, query proceeds                           │
│ If NO policy allows, query blocked with "permission denied"    │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─ Policy matches ─────────────────┐
        │                                   │
        ▼                                   ▼
   ALLOWED                              DENIED
   Execute query                        Return error:
   Return rows matching policy          "permission denied"
```

---

## RLS Policies: Decision Tree

```
User tries to query admins table
│
├─ Query Type: SELECT
│  │
│  ├─ Is user authenticated?
│  │  │
│  │  ├─ NO: Try "admins_select_all" → Denied
│  │  │
│  │  └─ YES:
│  │     ├─ Trying to read own record (auth.uid() = id)?
│  │     │  YES → "admins_select_own" ✓ ALLOWED
│  │     │
│  │     └─ Trying to read others?
│  │        ├─ User has role='admin'?
│  │        │  YES → "admins_select_all" ✓ ALLOWED
│  │        │  NO → ✗ DENIED
│  │
│
├─ Query Type: INSERT
│  │
│  ├─ Is user authenticated?
│  │  │
│  │  ├─ NO: ✗ DENIED
│  │  │
│  │  └─ YES:
│  │     ├─ Inserting record with own ID (auth.uid() = id)?
│  │     │  YES → "admins_insert" ✓ ALLOWED (registration)
│  │     │  NO → ✗ DENIED
│  │
│
├─ Query Type: UPDATE
│  │
│  ├─ Is user authenticated?
│  │  │
│  │  ├─ NO: ✗ DENIED
│  │  │
│  │  └─ YES:
│  │     ├─ Updating own record (auth.uid() = id)?
│  │     │  YES → "admins_update_own" ✓ ALLOWED
│  │     │  NO → ✗ DENIED
│  │
│
└─ Query Type: DELETE
   │
   ├─ Is user authenticated?
   │  │
   │  ├─ NO: ✗ DENIED
   │  │
   │  └─ YES:
   │     ├─ Deleting own record (auth.uid() = id)?
   │     │  YES → "admins_delete_own" ✓ ALLOWED
   │     │  NO → ✗ DENIED
```

---

## File Dependencies

```
                    adminlogin.html
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    index.html      supabase-client.js    style.css
                          │
                          ▼
                    db-helper.js
                          │
                          ▼
                    admin-login.js


                  adminregister.html
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    index.html      supabase-client.js    style.css
                          │
                          ▼
                    db-helper.js
                          │
                          ▼
                  admin-register.js


              db-connection-test.html
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    supabase-client.js  db-helper.js   (self-contained)
```

---

## Authentication State Machine

```
                           START
                             │
                             ▼
                    ┌─────────────────┐
                    │   Not Logged In  │
                    │  (user = null)   │
                    └─────────────────┘
                      │               │
                      │ Register       │ Login
                      │ (create auth)  │ (auth.signIn)
                      │               │
                      └─────┬─────────┘
                            ▼
                    ┌─────────────────┐
                    │   Logged In      │
                    │  (user = {..})   │
        ┌───────────│  Session Active  │───────────┐
        │           └─────────────────┘            │
        │                                           │
        │ Logout: auth.signOut()                    │
        │                                           │
        ▼                                           ▼
    ┌─────────────────┐               ┌──────────────────────┐
    │   Not Logged In  │               │  Can access data via │
    │   (Session ends) │               │  RLS policies        │
    └─────────────────┘               └──────────────────────┘
        │                              (admins_select_own,
        └──────────────────────────────  admins_update_own, etc)
                   │
                   ▼
            Redirect to login
```

---

## Database Schema

```
public.admins (Table)
│
├─ id (UUID, Primary Key)
│  └─ Generated on registration
│  └─ Matches auth user ID
│
├─ employee_id (Text, Unique)
│  └─ Used for login
│  └─ Example: "EMP001"
│
├─ email (Text, Unique)
│  └─ Matches auth email
│  └─ Example: "admin@example.com"
│
├─ full_name (Text)
│  └─ Display name
│  └─ Example: "John Admin"
│
├─ role (Text)
│  └─ User's role
│  └─ Default: "admin"
│  └─ Future: "viewer", "editor", etc
│
├─ created_at (Timestamp)
│  └─ Auto-generated on insert
│  └─ Never changes
│
└─ updated_at (Timestamp)
   └─ Auto-generated on insert
   └─ Updated by trigger on every UPDATE
   └─ Trigger: update_admins_updated_at
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────┐
│ Layer 1: Browser to Network                         │
│ - HTTPS encryption (TLS)                            │
│ - Session tokens (secure HttpOnly cookies)          │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ Layer 2: Supabase Authentication                    │
│ - Password hashing (bcrypt)                         │
│ - Email verification (optional)                     │
│ - JWT tokens                                        │
│ - Session management                                │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ Layer 3: Row Level Security (RLS)                   │
│ - Policy checks on every query                      │
│ - auth.uid() matching                               │
│ - role-based policies                               │
│ - Enforced at database level                        │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ Layer 4: Database                                   │
│ - PostgreSQL permissions                           │
│ - Unique constraints                                │
│ - Foreign key constraints                           │
│ - Data validation                                   │
└──────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
Your Users' Browsers
    │
    ├─ HTTP/HTTPS ────────────────┐
    │                              │
    ▼                              ▼
Your Web Server              Supabase CDN
(Serves HTML, CSS, JS)    (Serves static files)
    │                              │
    └──────────────┬───────────────┘
                   │
                   ▼ (WebSocket/REST)
          Supabase Platform
                   │
       ┌───────────┼────────────┐
       │           │            │
       ▼           ▼            ▼
    Auth API   Database    Real-time
    (Sign in)  (Queries)   (Sync)
       │           │            │
       └───────────┼────────────┘
                   │
                   ▼
          PostgreSQL Database
                   │
                   ├─ RLS Policies
                   ├─ Admins Table
                   └─ Auth Users Table
```

---

## Error Handling Flow

```
User Action
    │
    ▼
Try DatabaseHelper Method
    │
    ├─ Input Validation
    │  ├─ Missing fields? → Return error
    │  └─ Invalid format? → Return error
    │
    ├─ Database Ready?
    │  ├─ Not ready? → Wait or timeout
    │  └─ Ready? → Continue
    │
    ├─ Execute Query
    │  ├─ Network error? → Return error
    │  ├─ RLS policy denies? → Return "permission denied"
    │  ├─ Record not found? → Return null
    │  └─ Success? → Return data
    │
    └─ Return Result to JavaScript
       │
       ├─ {success: true, ...} 
       │  └─ Show success to user
       │
       └─ {success: false, error: "message"}
          └─ Show error to user
```

---

## Information Hierarchy

```
                    Browser User
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    User sees      User interacts    Form submit
    HTML/CSS       with form         event
         │               │               │
         └───────────────┴───────────────┘
                         │
                         ▼
              JavaScript Event Handler
              (admin-login.js)
                         │
                         ▼
              DatabaseHelper Method
              (db-helper.js)
                         │
                         ▼
              Supabase Client
              (supabase-client.js)
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
      Auth Service              Database Service
           │                           │
           └──────────────┬────────────┘
                          │
                          ▼
                  Supabase Platform
                          │
                          ▼
                  RLS Policy Engine
                          │
                          ▼
                PostgreSQL Database
```

---

These diagrams show:
- How components interact
- Data flows through the system
- RLS policies protecting access
- Security layers protecting users
- Error handling processes
- Authentication state changes

Use these as reference when building new features or troubleshooting issues.
