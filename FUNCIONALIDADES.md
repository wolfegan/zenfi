# 🚀 Zenfi — Documentação de Funcionalidades e Arquitetura

O **Zenfi** é um aplicativo moderno de gestão financeira pessoal desenvolvido para proporcionar clareza, organização e tranquilidade na vida financeira, sem necessidade de planilhas complexas.

---

## 📌 Principais Funcionalidades

### 1. 🔐 Autenticação e Segurança de Acesso
- **Cadastro e Login**: Autenticação via e-mail e senha com gerenciamento seguro de sessões via **Supabase Auth**.
- **Entrar como Convidado**: Acesso rápido sem cadastro (modo demonstração) para testar o aplicativo.
- **Proteção de Rotas (`ProtectedRoute`)**: Redirecionamento automático de usuários não logados para a tela de login (`/auth`) ao tentar acessar qualquer URL privada (`/transactions`, `/dashboard`, `/credit-cards`, `/settings`, etc.). A Landing Page (`/`) permanece livre para visitantes.

### 2. 🎯 Briefing & Onboarding Inicial (Recomeço do Zero)
- **Assistente de Boas-Vindas**: Apresentado após a criação da conta ou redefinição de dados.
- **Configuração de Perfil**: Coleta de renda mensal estimada e objetivo financeiro principal.
- **Categorização Personalizada**: Seleção e adição de categorias iniciais de receitas e despesas.

### 3. 📊 Dashboard Principal (Painel Financeiro)
- **Score de Saúde Financeira**: Algoritmo que analisa saldo, comprometimento de renda, orçamentos e reserva para atribuir uma nota de saúde financeira e dicas personalizadas.
- **Resumo de Balanço**: Exibição de Receitas do Mês, Despesas do Mês, Saldo Acumulado e variação percentual.
- **Gráficos e Indicadores**: Visualização de fluxo de caixa, gastos por categoria, progresso de orçamentos e resumo de metas.

### 4. 💳 Cartões de Crédito e Faturas
- **Gestão de Limite**: Acompanhamento visual do limite total, limite utilizado e limite disponível.
- **Controle de Faturas**: Organização de faturas por mês, dia de fechamento e dia de vencimento.
- **Pagamento de Faturas**: Baixa de faturas com integração automática para dedução do saldo de contas bancárias.
- **Seletor Avançado de Cores**: 
  - Paleta expandida com mais de 20 cores dos principais bancos (Nubank, Itaú, Inter, C6, Santander, Caixa, Bradesco, XP, etc.).
  - **Seletor Livre (🎨 Custom Hex Color Picker)** para aplicar qualquer cor personalizada ao cartão.

### 5. 🏷️ Lançamentos e Transações (`/transactions`)
- **Registro de Entradas e Saídas**: Cadastro de receitas e despesas com data, valor, categoria e descrição.
- **Gastos Fixos x Variáveis**: Marque transações recorrentes mensais.
- **Vínculo com Cartões e Contas**: Lançamentos direto na fatura de um cartão ou na conta corrente.
- **Filtros Avançados**: Filtre por busca textual, mês/ano, tipo (receita/despesa) e categoria.

### 6. 🏛️ Contas Bancárias e Carteiras (`/accounts`)
- **Múltiplas Contas**: Cadastro de conta corrente, poupança, carteira física ou conta de investimentos.
- **Saldo Consolidado**: Cálculo automático do patrimônio em liquidez nas contas.

### 7. 🏷️ Categorias Personalizadas (`/categories`)
- **Organização de Gastos**: Criação e edição de categorias de entrada e saída.
- **Personalização Visual**: Escolha de nomes, ícones (Lucide) e cores para cada categoria.

### 8. 📉 Orçamentos Mensais (`/budgets`)
- **Teto de Gastos**: Definição de limites de despesa por categoria para o mês.
- **Alertas Visuais**: Indicadores percentuais do orçamento utilizado para evitar estouro de limite.

### 9. 📈 Investimentos (`/investments`)
- **Carteira de Ativos**: Acompanhamento de investimentos em Renda Fixa, Ações, FIIs, Cripto e outros ativos.
- **Evolução Patrimonial**: Registro de aportes e rentabilidade.

### 10. 🤝 Dívidas & Crediários (`/debts`)
- **Controle de Passivos**: Registro de empréstimos, financiamentos e crediários parcelados.
- **Acompanhamento de Quitação**: Barra de progresso para acompanhar o abatimento e quitação de parcelas.

### 11. 🎯 Metas Financeiras (`/goals`)
- **Objetivos de Curto e Longo Prazo**: Cadastro de metas (ex: Reserva de Emergência, Viagem, Casa Própria).
- **Aportes e Progresso**: Registro de depósitos com cálculo de tempo estimado e percentual concluído.

### 12. 📑 Relatórios e Gráficos (`/reports`)
- **Análise Comparativa**: Gráficos de evolução mensal de receitas vs. despesas.
- **Distribuição de Gastos**: Gráficos de rosca e barras mostrando onde o dinheiro está sendo gasto.

### 13. ⚙️ Configurações & Redefinição de Conta (`/settings`)
- **Perfil do Usuário**: Edição de nome, e-mail, renda mensal e objetivo.
- **Aparência**: Alternância rápida entre **Modo Claro (Light Mode)** e **Modo Escuro (Dark Mode)**.
- **🔴 Redefinir Conta (Começar do Zero)**:
  - Limpa todas as transações, cartões, faturas, dívidas, investimentos, orçamentos, metas e contas do usuário no Supabase.
  - Reseta o estado do perfil e direciona o usuário para a **tela de briefing inicial** no Dashboard para preencher os primeiros dados do zero.

### 14. 🐛 Central de Reporte de Bugs e Sugestões
- **Modal de Feedback**: Acessível pela barra lateral e pelas Configurações.
- **Campos**: Título do problema, Descrição detalhada e **Anexo de arquivos/imagens (até 5MB)**.
- **Encaminhamento Direto**: Envio automático de e-mail para `victorwolfegan@gmail.com` via integração de e-mail e salvamento no banco de dados.

### 15. 📱 PWA (Progressive Web App)
- **Instalação no Celular**: Configurado com o nome oficial **`Zenfi — Gestão Financeira`** (short_name: **`Zenfi`**).
- **Ícones e Cores de Tema**: Suporte completo a instalação como aplicativo standalone em dispositivos Android e iOS.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: React 19, TypeScript, Vite
- **Estilização**: Tailwind CSS 4, CSS Variables, Lucide Icons
- **Animações**: Framer Motion
- **Gráficos**: Recharts
- **Notificações Toast**: Sonner
- **Backend e Banco de Dados**: Supabase (Auth, PostgreSQL, Storage, Row Level Security)
- **PWA**: Web App Manifest oficial do Zenfi
