# README

<p align="center">
  <pre style="font-family: monospace; font-weight: bold; background: #0f172a; border-radius: 12px; padding: 20px; color: #e2e8f0; line-height: 1.25; border: 1px solid #334155;">
<span style="color: #10b981;">  ______ ______ _   _ ______ _____ </span>
<span style="color: #10b981;"> |___  /|  ____|| \ | ||  ____||_   _|</span>
<span style="color: #10b981;">    / / | |__   |  \| || |__     | |  </span>
<span style="color: #34d399;">   / /  |  __|  | . ` ||  __|    | |  </span>
<span style="color: #34d399;">  / /__ | |____ | |\  || |      _| |_ </span>
<span style="color: #6ee7b7;"> /_____||______||_| \_||_|     |_____|</span>
  </pre>
  <h3 align="center" style="color: #0f172a; font-family: 'Inter', sans-serif; font-size: 1.5rem; margin-top: 10px;">Suas finanças no zen.</h3>
  <p align="center">
    <a href="https://github.com/wolfegan/zenfi">
      <img src="zenfi-logo-full.png" width="380" alt="Zenfi Logo" style="border-radius: 8px;" />
    </a>
  </p>
</p>

---

## 🍃 O que é o Zenfi?

**Zenfi** é um aplicativo moderno e elegante de controle financeiro pessoal, desenvolvido com o objetivo de trazer **calma, clareza e controle** para a sua rotina financeira. Esqueça planilhas complexas e aplicativos poluídos. O Zenfi oferece uma experiência minimalista com foco em usabilidade e feedback visual imediato (como o medidor de saúde financeira Serasa).

---

## 🚀 Tecnologias Utilizadas

O projeto utiliza uma stack extremamente moderna e de alta performance:

- **Frontend**: React 19, TypeScript, Vite
- **Roteamento**: React Router v7 (todas as rotas unificadas)
- **Estilização**: Tailwind CSS v4 (design tokenizado com paleta de cores personalizada)
- **Componentes**: Primitivos do Shadcn UI & Lucide Icons
- **Animações**: Framer Motion & CSS keyframe transitions
- **Backend & Banco de Dados**: Supabase (Autenticação, RLS e tabelas relacionais)

---

## 📋 Recursos Principais

1. **Painel Consolidado (Dashboard)**: Patrimônio líquido (Ativos vs Passivos), receitas, despesas, alertas de vencimento e medidor animado de saúde financeira.
2. **Gerenciador de Transações**: Busca instantânea, filtros mensais e marcadores visuais para gastos fixos e despesas de cartão.
3. **Categorias Customizadas**: Separação clara entre receitas e despesas com escolha de cores e ícones personalizados.
4. **Orçamentos Mensais**: Definição de limites de gastos por categoria para controle ativo do seu caixa.
5. **Cartões de Crédito**: Acompanhamento de limites disponíveis, vencimentos e faturas.
6. **Investimentos**: Monitoramento de carteira por tipo (Ações, Cripto, Renda Fixa, Imóveis).
7. **Dívidas**: Controle de saldo devedor restante e pagamento mensal mínimo.
8. **Metas Financeiras**: Progresso visual em barras de metas de poupança (Reserva de emergência, viagens, etc.).

---

## ⚙️ Configuração e Instalação

Siga o passo a passo abaixo para rodar o projeto localmente:

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/wolfegan/zenfi.git
cd zenfi
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e adicione as suas chaves do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-public-publishable-anon-key
```

> [!IMPORTANT]
> Certifique-se de usar a **Publishable key** (`sb_publishable_...`) do Supabase e nunca a Secret Key para manter seu banco seguro.

### 3. Criar a Estrutura do Banco de Dados
Para o aplicativo funcionar corretamente, você precisa executar o arquivo de migração SQL no seu painel do Supabase:
1. Abra o arquivo `src/lib/supabase-schema.sql`.
2. Copie todo o conteúdo.
3. No painel do seu projeto no Supabase, acesse **SQL Editor** -> **New Query**.
4. Cole o código e clique em **Run**.

---

## 🏃 Como Executar

### Desenvolvimento Local (Vite Dev Server)
Para rodar a aplicação em ambiente de desenvolvimento com Hot Module Replacement (HMR):
```bash
npm run dev
```
Acesse no navegador através de: **http://localhost:5173**

### Compilação de Produção (Build)
Para compilar e otimizar os assets para produção:
```bash
npm run build
```
O build otimizado será gerado na pasta `/dist`.

---

## 🛡️ Segurança & RLS (Row Level Security)

Todas as tabelas do banco de dados no Supabase contam com políticas de **Row Level Security (RLS)** ativas. Isso garante que:
- Usuários autenticados só podem ler, inserir, atualizar ou excluir dados que pertençam ao seu próprio `user_id`.
- Um usuário nunca conseguirá acessar as transações, cartões ou metas de outro usuário do sistema.
