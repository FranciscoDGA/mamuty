-- Tabela de jobs de automação
CREATE TABLE IF NOT EXISTS automation_jobs (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  cliente_id TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  cliente_phone TEXT NOT NULL DEFAULT '',
  agendamento_id TEXT,
  servico_interesse TEXT,
  mensagem TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agendado_para TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_em TIMESTAMPTZ,
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  erro TEXT,
  meta JSONB DEFAULT '{}'
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_agendado ON automation_jobs(agendado_para);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_tipo ON automation_jobs(tipo);

-- RLS (apenas service role acessa, mas client-side usa anon com policy aberta para debug)
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON automation_jobs
  FOR ALL USING (true) WITH CHECK (true);
