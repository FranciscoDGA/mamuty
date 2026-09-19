-- Migration to create tables for conversation logging and active sessions

-- 1. Conversation Sessions Table (context memory for the bot)
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
    id text PRIMARY KEY,
    client_phone text NOT NULL,
    client_name text,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
    message_count integer NOT NULL DEFAULT 1,
    intents jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'active'::text,
    context jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_phone_status 
ON public.conversation_sessions (client_phone, status);

-- 2. Conversation Logs Table (to keep track of all messages)
CREATE TABLE IF NOT EXISTS public.conversation_logs (
    id text PRIMARY KEY,
    client_phone text NOT NULL,
    client_name text,
    direction text NOT NULL, -- 'incoming' ou 'outgoing'
    message text,
    intent text,
    tool_used text,
    action text,
    status text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    response_time_ms integer,
    metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_phone_time 
ON public.conversation_logs (client_phone, timestamp DESC);

-- Enable RLS for security
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon (via service role) to do everything 
-- (adjust according to your security requirements)
CREATE POLICY "Enable all access for all users on conversation_sessions"
ON public.conversation_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for all users on conversation_logs"
ON public.conversation_logs FOR ALL USING (true) WITH CHECK (true);
