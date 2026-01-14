-- Audit Trail Table for Admin Actions
CREATE TABLE IF NOT EXISTS public.admin_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster queries by employee_id and time
CREATE INDEX IF NOT EXISTS idx_audit_employee_id ON public.admin_audit_trail(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.admin_audit_trail(created_at);
