import { useAuth } from "@/hooks/use-auth";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Check, CreditCard, Fingerprint, Leaf, Menu, PieChart, ShieldCheck, Sparkles, Target, TrendingUp, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./Landing.css";

const ease = [0.22, 1, 0.36, 1] as const;
const benefits = ["Contas e cartões em um só lugar", "Orçamentos que cabem na sua rotina", "Metas visíveis e alcançáveis"];
const features = [
  { eyebrow: "Visão total", title: "Seu dinheiro, sem pontos cegos.", text: "Saldos, faturas, receitas e despesas em uma visão que faz sentido.", icon: PieChart, theme: "forest", visual: "overview" },
  { eyebrow: "Orçamentos", title: "Limites que acompanham a vida real.", text: "Entenda quanto ainda pode gastar antes do mês apertar.", icon: Target, theme: "lime", visual: "budget" },
  { eyebrow: "Cartões", title: "Faturas previsíveis. Sem sustos.", text: "Acompanhe fechamento, vencimento e gastos por cartão.", icon: CreditCard, theme: "cream", visual: "card" },
  { eyebrow: "Evolução", title: "Progresso que dá vontade de continuar.", text: "Metas e indicadores mostram, com clareza, o quanto você avançou.", icon: TrendingUp, theme: "sage", visual: "progress" },
];
const steps = [
  ["01", "Organize o agora", "Adicione contas, cartões e movimentações. O Zenfi monta a visão geral."],
  ["02", "Escolha prioridades", "Crie orçamentos e metas que combinam com o seu momento."],
  ["03", "Evolua no seu ritmo", "Acompanhe hábitos, ajuste rotas e veja sua saúde financeira melhorar."],
];

function ProductPreview() {
  return <motion.div className="zf-product" initial={{ opacity: 0, y: 28, rotate: 1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .9, delay: .2, ease }} aria-label="Prévia do painel financeiro Zenfi">
    <div className="zf-product-top"><div className="zf-product-brand"><span><Leaf size={15}/></span>Zenfi</div><small>Este mês</small></div>
    <div className="zf-product-body">
      <div className="zf-product-heading"><div><small>Olá, Marina</small><h3>Seu mês está no caminho certo.</h3></div><b>MO</b></div>
      <div className="zf-product-grid">
        <div className="zf-balance"><small>Saldo disponível</small><strong>R$ 8.420,30</strong><span><TrendingUp size={13}/> 12% melhor que junho</span></div>
        <div className="zf-score"><div><strong>82</strong></div><p><small>Saúde financeira</small><b>Muito boa</b></p></div>
        <div className="zf-chart-card"><p><span>Evolução do saldo</span><b>+18,4%</b></p><div className="zf-chart">{[29,44,38,61,53,72,88].map((h,i)=><i key={i} style={{height: h+'%'}}/>)}</div></div>
        <div className="zf-budget-card"><p><span>Orçamento</span><b>68%</b></p><div><strong>R$ 2.720</strong><small>de R$ 4.000</small></div></div>
      </div>
    </div>
    <div className="zf-float zf-float-top"><span><Sparkles size={14}/></span><p><b>Boa notícia</b><small>Você economizou R$ 340</small></p></div>
    <div className="zf-float zf-float-bottom"><span><Check size={14}/></span><p><b>Meta atualizada</b><small>Reserva de emergência · 64%</small></p></div>
  </motion.div>;
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "overview") return <div className="zf-mini-overview"><p><span>Patrimônio</span><strong>R$ 42.680</strong><small>+ R$ 1.240 este mês</small></p><div>{[44,61,52,73,67,86,94].map((h,i)=><i key={i} style={{height:h+'%'}}/>)}</div></div>;
  if (type === "budget") return <div className="zf-mini-budget"><span>Maio</span><strong>72%</strong><div><i/></div><small>R$ 1.120 ainda disponíveis</small></div>;
  if (type === "card") return <div className="zf-mini-card"><span>zenfi one</span><strong>•••• 2048</strong><small>Fatura atual</small><b>R$ 1.840,50</b></div>;
  return <div className="zf-mini-progress"><div><span>64%</span></div><p><strong>Reserva de emergência</strong><span>R$ 9.600 de R$ 15.000</span><small><TrendingUp size={13}/> +8% nos últimos 30 dias</small></p></div>;
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const go = () => navigate(isAuthenticated ? "/dashboard" : "/auth");
  const reveal = reducedMotion ? {} : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: .65, ease } };
  return <div className="zf-landing">
    <header className="zf-header"><div className="zf-shell zf-nav">
      <Link to="/" className="zf-logo" aria-label="Zenfi, página inicial"><span><Leaf size={17}/></span>Zenfi</Link>
      <nav><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#seguranca">Segurança</a></nav>
      <div className="zf-nav-actions"><button className="zf-link" onClick={go}>{isLoading ? "Aguarde" : isAuthenticated ? "Meu painel" : "Entrar"}</button><button className="zf-button zf-button-small" onClick={go}>{isAuthenticated ? "Abrir Zenfi" : "Começar grátis"}<ArrowRight size={16}/></button></div>
      <button className="zf-menu" onClick={()=>setMenu(!menu)} aria-label={menu ? "Fechar menu" : "Abrir menu"}>{menu?<X/>:<Menu/>}</button>
    </div>{menu&&<motion.div className="zf-mobile" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}><a href="#recursos" onClick={()=>setMenu(false)}>Recursos</a><a href="#como-funciona" onClick={()=>setMenu(false)}>Como funciona</a><a href="#seguranca" onClick={()=>setMenu(false)}>Segurança</a><button onClick={go}>Começar grátis</button></motion.div>}</header>

    <main>
      <section className="zf-hero"><div className="zf-hero-glow"/><div className="zf-shell zf-hero-grid">
        <motion.div className="zf-hero-copy" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.75,ease}}>
          <span className="zf-kicker"><i/>Controle financeiro para a vida real</span>
          <h1>Dinheiro em ordem.<br/><em>Vida mais leve.</em></h1>
          <p>O Zenfi transforma números soltos em decisões simples. Veja para onde seu dinheiro vai, planeje o próximo passo e avance sem culpa.</p>
          <div className="zf-hero-actions"><button className="zf-button" onClick={go}>{isAuthenticated?"Ir para o meu painel":"Organizar minhas finanças"}<ArrowRight size={18}/></button><a href="#recursos">Conhecer o Zenfi <span>↓</span></a></div>
          <div className="zf-proof"><div><span>AM</span><span>RC</span><span>LS</span></div><p><strong>Feito para ser simples</strong><small>Configure em menos de 5 minutos.</small></p></div>
        </motion.div><ProductPreview/>
      </div></section>
      <section className="zf-benefits"><div className="zf-shell">{benefits.map(x=><div key={x}><Check size={17}/>{x}</div>)}</div></section>

      <section id="recursos" className="zf-section"><div className="zf-shell">
        <motion.div className="zf-section-heading" {...reveal}><span className="zf-kicker"><i/>Tudo no lugar</span><h2>Clareza para hoje.<br/>Fôlego para amanhã.</h2><p>Menos planilhas, menos ansiedade. Uma experiência desenhada para você entender, decidir e seguir em frente.</p></motion.div>
        <div className="zf-feature-grid">{features.map((f,i)=>{const Icon=f.icon;return <motion.article key={f.title} className={'zf-feature zf-'+f.theme} {...reveal} transition={{duration:.65,delay:i*.06,ease}}><div className="zf-feature-copy"><span className="zf-feature-icon"><Icon size={19}/></span><small>{f.eyebrow}</small><h3>{f.title}</h3><p>{f.text}</p></div><FeatureVisual type={f.visual}/></motion.article>})}</div>
      </div></section>

      <section id="como-funciona" className="zf-how"><div className="zf-shell"><motion.div {...reveal}><span className="zf-kicker light"><i/>Sem complicação</span><h2>Você não precisa virar especialista em finanças.</h2><p>Precisa apenas de um lugar que traduza o que está acontecendo.</p></motion.div><div className="zf-steps">{steps.map((s,i)=><motion.article key={s[0]} {...reveal} transition={{duration:.6,delay:i*.08,ease}}><span>{s[0]}</span><h3>{s[1]}</h3><p>{s[2]}</p></motion.article>)}</div></div></section>

      <section id="seguranca" className="zf-section zf-security-section"><div className="zf-shell zf-security"><motion.div className="zf-security-visual" {...reveal}><div className="zf-shield"><Fingerprint size={78}/><span><ShieldCheck size={19}/></span></div><div className="zf-stamp"><strong>Seus dados</strong><span>sob seu controle</span></div></motion.div><motion.div className="zf-security-copy" {...reveal}><span className="zf-kicker"><i/>Privacidade primeiro</span><h2>Confiança também faz parte do saldo.</h2><p>O Zenfi foi desenhado para manter sua vida financeira privada. Seus dados são protegidos e usados somente para entregar a sua experiência.</p><ul><li><ShieldCheck size={18}/>Acesso protegido por autenticação</li><li><Fingerprint size={18}/>Cada conta enxerga apenas os próprios dados</li><li><WalletCards size={18}/>Sem anúncios ou venda de informações</li></ul></motion.div></div></section>

      <section className="zf-quote"><div className="zf-shell"><motion.blockquote {...reveal}><BarChart3 size={30}/><p>“Organizar o dinheiro não deveria parecer um castigo. Deveria trazer a mesma sensação de arrumar a casa: finalmente, espaço para respirar.”</p><footer>O princípio por trás do Zenfi</footer></motion.blockquote></div></section>
      <section className="zf-final"><div className="zf-shell"><motion.div className="zf-final-card" {...reveal}><div><span className="zf-kicker light"><i/>Seu próximo passo</span><h2>Comece pequeno.<br/>Enxergue longe.</h2></div><div><p>Leva poucos minutos para colocar sua vida financeira em ordem.</p><button className="zf-button zf-button-lime" onClick={go}>{isAuthenticated?"Abrir meu painel":"Começar grátis agora"}<ArrowRight size={18}/></button><small>Grátis para começar · Sem cartão de crédito</small></div></motion.div></div></section>
    </main>
    <footer className="zf-footer"><div className="zf-shell"><div><Link to="/" className="zf-logo footer"><span><Leaf size={17}/></span>Zenfi</Link><p>Finanças no lugar.<br/>Cabeça tranquila.</p></div><nav><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#seguranca">Segurança</a></nav><div className="zf-footer-meta"><span>© {new Date().getFullYear()} Zenfi</span><span>Feito com calma no Brasil.</span></div></div></footer>
  </div>;
}