# Database Migration Instructions

## Problem
The application is failing because the following tables don't exist in your Supabase database:
- `chat_messages`
- `verification_reports`
- `emergency_reports`
- `responders`
- `proof_records`

## Solution
You need to apply the migration file that's already in your project.

### Steps to Fix:

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project dashboard

2. **Access the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Apply the Migration**
   - Copy the entire contents of `supabase/migrations/20250620034810_azure_recipe.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should now see all the required tables:
     - proof_records
     - emergency_reports
     - responders
     - chat_messages
     - verification_reports

5. **Restart Your Application**
   - The application should now work without the "relation does not exist" errors

### Alternative Method:
If you have the Supabase CLI installed locally:
```bash
supabase db push
```

## What This Migration Creates:
- **proof_records**: Evidence files with blockchain verification
- **emergency_reports**: Crisis reports and incidents  
- **responders**: Emergency response personnel
- **chat_messages**: Real-time communication threads
- **verification_reports**: AI analysis and verification data

All tables include proper Row Level Security (RLS) policies and indexes for optimal performance.