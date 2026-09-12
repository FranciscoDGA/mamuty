# Guia de Treinamento - Barbearia Mamuty

Sistema de gestão para o Sr. Hemerson Barber.

**Acesse:** https://mamuty.vercel.app

---

## 1. Como Acessar o Sistema

**Painel Administrativo (donos e equipe):**
- Acesse: `https://mamuty.vercel.app/admin`
- Email: `hemersonpbarber@gmail.com`
- Senha: `mamuty123`
- Clique em "Entrar"

**Agendamento Público (clientes):**
- Acesse: `https://mamuty.vercel.app/agendar`
- Não precisa de login

> Dica: Salve os dois endereços nos favoritos do celular.

---

## 2. Como Visualizar a Agenda

1. Faça login em `/admin`
2. Clique em **"Painel Operacional"** no menu lateral
3. Você verá:
   - **Fila de hoje** — todos os agendamentos do dia
   - **Status de cada um** — aguardando, confirmado, em andamento, concluído
   - **Hora marcada vs hora atual** — atrasos aparecem em vermelho
   - **Receita do dia** — total faturado

**Visualizar agenda completa:**
1. Clique em **"Agenda"** no menu
2. Use o calendário para navegar entre dias
3. Veja os horários bloqueados e disponiveis

---

## 3. Como Cadastrar Cliente

Clientes são cadastrados **automaticamente** quando fazem um agendamento pelo site.

Para cadastrar manualmente:
1. Acesse **"Clientes"** no menu lateral
2. Clique em **"+ Novo Cliente"**
3. Preencha:
   - Nome completo
   - Telefone (com DDD)
   - Email (opcional)
4. Clique em **"Salvar"**

> O sistema já mostra automaticamente: total de visitas, total gasto, última visita e próxima visita de cada cliente.

---

## 4. Como Cadastrar Serviço

1. Acesse **"Serviços"** no menu lateral
2. Clique em **"+ Novo Serviço"**
3. Preencha:
   - **Nome** (ex: "Corte Degradê")
   - **Preço** (ex: 45.00)
   - **Duração** em minutos (ex: 40)
4. Clique em **"Salvar"**

Para editar ou excluir um serviço existente, clique nos ícones ao lado do serviço.

**Exemplos de serviços:**
| Serviço | Preço | Duração |
|---------|-------|---------|
| Corte Simples | R$ 35 | 30 min |
| Corte + Barba | R$ 60 | 45 min |
| Barba | R$ 35 | 25 min |
| Degradê | R$ 45 | 40 min |

---

## 5. Como Cadastrar Barbeiro

1. Acesse **"Profissionais"** no menu lateral
2. Clique em **"+ Novo Profissional"**
3. Preencha:
   - **Nome** (ex: "Hemerson")
   - **Especialidades** (ex: "Degradê, Barba, Corte Social")
   - **Foto** (envie uma imagem)
4. Clique em **"Salvar"**

> Cada barbeiro pode ter sua própria agenda e horários de funcionamento.

---

## 6. Como Bloquear Horário

**Bloquear um horário específico:**
1. Acesse **"Agenda"** no menu lateral
2. Clique em **"Configurar Agenda"**
3. Na seção **"Horários Bloqueados"**:
   - Selecione a data
   - Selecione o horário de início
   - Selecione o horário de fim
   - Selecione o barbeiro (ou "Todos")
4. Clique em **"Bloquear"**

**Fechar a barbearia em um dia:**
1. Na mesma tela, vá para **"Dias Fechados"**
2. Selecione a data
3. Adicione um motivo (ex: "Feriado", "Folga")
4. Clique em **"Fechar Dia"**

**Horário de almoço:**
- O sistema já bloqueia automaticamente das **12h às 14h** por padrão
- Para alterar, edite as configurações de agenda

---

## 7. Como Alterar Agendamento

1. Acesse **"Painel Operacional"**
2. Encontre o agendamento que deseja alterar
3. Clique no ícone de **editar** (lápis)
4. Altere o que precisar:
   - Data
   - Horário
   - Barbeiro
   - Serviço
5. Clique em **"Confirmar"**

> O sistema verifica automaticamente se há conflito de horário.

---

## 8. Como Cancelar Agendamento

**Pelo Painel Operacional:**
1. Encontre o agendamento
2. Clique em **"Cancelar"**
3. Confirme a ação

**Pelo Menu Clientes:**
1. Acesse **"Clientes"**
2. Encontre o cliente
3. Veja seus agendamentos
4. Clique em **"Cancelar"** no agendamento desejado

> O cliente também pode cancelar pelo link: `https://mamuty.vercel.app/meus-agendamentos`

---

## 9. Como Remarcar Agendamento

1. Acesse **"Painel Operacional"**
2. Encontre o agendamento
3. Clique em **"Reagendar"**
4. Selecione a nova data
5. Selecione o novo horário
6. Confirme o barbeiro e serviço
7. Clique em **"Confirmar Reagendamento"**

> O sistema mostra horários disponíveis e bloqueia conflitos automaticamente.

---

## 10. Como Usar o Link /agendar

O link público de agendamento é:
```
https://mamuty.vercel.app/agendar
```

**Como funciona para o cliente:**
1. Acessa o link
2. Escolhe o barbeiro (ou "Qualquer disponível")
3. Escolhe o serviço
4. Escolhe a data
5. Escolhe o horário
6. Preenche nome e telefone
7. Escolhe a forma de pagamento
8. Confirma o agendamento
9. Recebe a confirmação com QR Code

---

## 11. Como Divulgar o Link

**WhatsApp (recomendado):**
1. Copie o link: `https://mamuty.vercel.app/agendar`
2. Crie um texto para enviar aos clientes. Exemplo:

> "Fala, tudo bem! 👋
> Agora você pode agendar seu horário pela internet, de forma rápida e prática!
> 
> 📱 Clique aqui: https://mamuty.vercel.app/agendar
> 
> É só escolher o horário que funciona pra você. Até mais!"

**Instagram:**
1. Adicione o link na bio do Instagram
2. Crie um Stories com o link
3. Use a função "Link" nos Stories para o cliente clicar direto

**Cartão de visita:**
- Imprima o QR Code (disponível na página de confirmação do agendamento)
- Coloque no balcão

**Indicação boca a boca:**
- Peça para clientes satisfeitos indicarem o link
- "Manda esse link pro amigo que quer agendar"

---

## 12. Como Acompanhar os Clientes

1. Acesse **"Clientes"** no menu lateral
2. Você verá a lista completa com:

| Informação | O que mostra |
|------------|--------------|
| Nome | Nome do cliente |
| Telefone | Para contato |
| Tipo | Novo, Recorrente, VIP, Inativo |
| Total Gasto | Quanto já gastou no total |
| Última Visita | Quando foi a última vez |
| Próximo Agendamento | Data do próximo horário |

**Pesquisar um cliente:**
- Use a barra de pesquisa
- Digite o nome ou telefone

**Filtrar por tipo:**
- Clique em "Novos", "Recorrentes", "VIP" ou "Inativos"
- Veja quantos clientes tem em cada categoria

**Ver detalhes de um cliente:**
- Clique no nome do cliente
- Veja: histórico completo, gastos, visitas, agendamentos

---

## Dicas Importantes

### Fluxo do dia a dia:

1. **Manhã** → Abra o Painel Operacional, veja os agendamentos do dia
2. **Durante o dia** → Atualize os status: Chegou → Iniciar → Feito
3. **Fim do dia** → Veja o Fechamento de Caixa no Financeiro

### Status dos agendamentos:

| Status | Quando usar |
|--------|-------------|
| Aguardando | Cliente ainda não chegou |
| Confirmado | Cliente confirmou presença |
| Em andamento | Cliente está sendo atendido |
| Concluído | Serviço finalizado |
| Cancelado | Cliente cancelou |
| Não compareceu | Cliente não apareceu |

### Formas de pagamento aceitas:
- **PIX** (sem taxa)
- **Cartão de Crédito/Débito** (via maquininha)
- **Dinheiro** (espécie)

### Comissão dos barbeiros:
- Vá em **Financeiro** → **Controle de Comissões**
- Escolha a porcentagem: 40%, 50%, 60% ou 70%
- O cálculo é automático baseado no faturamento individual

---

## Dúvidas Frequentes

**"E se o cliente não aparecer?"**
- Clique em "Não Compareceu" no painel
- O horário fica liberado para outros clientes

**"Como saber se tem conflito de horário?"**
- O sistema bloqueia automaticamente
- Você só precisa escolher o horário livre

**"Posso alterar o preço de um serviço?"**
- Sim, acesse Serviços → editar → alterar o preço

**"Como vejo quanto faturei hoje?"**
- Acesse Financeiro → Fechamento do Dia

**"Posso usar no celular?"**
- Sim! O sistema funciona em qualquer dispositivo

---

## Contato para Suporte

Em caso de dúvidas técnicas ou problemas no sistema, entre em contato com o desenvolvedor.

---

*Guia atualizado em: Setembro 2026*
*Sistema Mamuty v1.0*
