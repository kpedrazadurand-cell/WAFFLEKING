/* global React, ReactDOM */
const {useState,useMemo,useEffect}=React;

const LOGO="assets/logo.png";
const WELCOME_VIDEO="assets/welcome.mp4";
const WELCOME_POSTER="assets/welcome-poster.jpg";

/* === NUEVO: video recordatorio de carrito === */
const REMINDER_VIDEO="assets/aviso.mp4";
const REMINDER_POSTER="assets/aviso-poster.jpg"; // opcional

/* ============ Packs (con imagen referencial) ============ */
const PACKS = [
  { id:"special", name:"Waffle Especial (1 piso)", price:25, incTop:3, incSir:2, desc:"Incluye 3 toppings + 2 siropes + dedicatoria", img:"assets/ref-special.jpg" },
  { id:"king",    name:"Waffle King (2 pisos)",    price:45, incTop:4, incSir:3, desc:"Incluye 4 toppings + 3 siropes + dedicatoria", img:"assets/ref-king.jpg" },
];

const MASAS = [
  { id:"clasica", name:"Clásica (harina de trigo)", delta:0 },
  { id:"fitness", name:"Premium (avena)",           delta:5 },
];

const TOPS = [
  { id:"t-fresa", name:"Fresa" },
  { id:"t-platano", name:"Plátano" },
  { id:"t-oreo", name:"Oreo" },
  { id:"t-sublime", name:"Sublime" },
  { id:"t-princesa", name:"Princesa" },
  { id:"t-cua", name:"Cua Cua" },
  { id:"t-obsesion", name:"Obsesión" },
];

const SIROPES=[
  {id:"s-maple",name:"Miel de maple",extra:0},
  {id:"s-fresa",name:"Jarabe de fresa",extra:0},
  {id:"s-dulce",name:"Dulce de leche",extra:0},
  {id:"s-fudge",name:"Fudge",extra:0},
  {id:"s-hers",name:"Hersheys",extra:2},
];

const PREMIUM=[
  {id:"p-kiwi",name:"Kiwi",price:3},{id:"p-duraznos",name:"Duraznos",price:3},
  {id:"p-pinguinito",name:"Pingüinito",price:3},{id:"p-snickers",name:"Snickers",price:5},
  {id:"p-brownie",name:"Brownie",price:3},{id:"p-mms",name:"M&M",price:5},
  {id:"p-kitkat",name:"Kit Kat",price:5},{id:"p-hersheysp",name:"Hersheys",price:5},
  {id:"p-ferrero",name:"Ferrero Rocher",price:5},
];

const soles=n=>"S/ "+(Math.round(n*100)/100).toFixed(2);
function toast(m){const t=document.getElementById("toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1300)}

function useCartCount(){
  const initial = (()=> {
    try { return JSON.parse(localStorage.getItem("wk_cart")||"[]").reduce((a,b)=>a+(+b.qty||0),0); }
    catch(_) { return 0; }
  })();
  const [c,setC]=useState(initial);
  useEffect(()=>{
    const on=()=>setC(JSON.parse(localStorage.getItem("wk_cart")||"[]").reduce((a,b)=>a+(+b.qty||0),0));
    window.addEventListener("storage",on);
    return()=>window.removeEventListener("storage",on)
  },[]);
  return[c,setC]
}

/* ================= Modal de Bienvenida (responsive fix) ================= */
function WelcomeModal({open,onClose,onStart}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{ if(open){ setTimeout(()=>setVisible(true),0); } },[open]);

  function closeWithAnim(cb){
    setVisible(false);
    setTimeout(()=>cb && cb(), 200);
  }
  if(!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="wk-welcome-title"
      onClick={(e)=>{ if(e.target===e.currentTarget) closeWithAnim(onClose); }}
      style={{background:'rgba(0,0,0,.45)'}}
    >
      <div
        className="relative bg-white rounded-2xl border-2 max-h-[80vh] overflow-visible"
        style={{
          borderColor:'#c28432',
          width:'min(92vw, 560px)',
          boxShadow:'0 20px 50px rgba(58,17,4,.28), 0 4px 18px rgba(58,17,4,.15)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(.98) translateY(6px)',
          opacity: visible ? 1 : 0,
          transition:'transform .2s ease, opacity .2s ease'
        }}
      >
        {/* Cerrar */}
        <button
          aria-label="Cerrar"
          onClick={()=>closeWithAnim(onClose)}
          className="absolute h-9 w-9 rounded-full flex items-center justify-center z-10 top-2 right-2 md:-top-3 md:-right-3"
          style={{
            border:'2px solid #c28432',
            color:'#3a1104', background:'#fff',
            boxShadow:'0 6px 16px rgba(58,17,4,.22)'
          }}
        >×</button>

        <div className="grid md:grid-cols-[240px,1fr] gap-4 p-4 md:p-5 items-center">
          {/* IZQ: personaje */}
          <div
            className="rounded-xl border-2 overflow-hidden mx-auto md:mx-0 md:ml-5 bg-white"
            style={{
              borderColor:'#c28432',
              width:'200px', height:'240px',
              boxShadow:'0 8px 16px rgba(58,17,4,.06)'
            }}
          >
            <video
              src={WELCOME_VIDEO}
              poster={WELCOME_POSTER}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
              controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
              onContextMenu={(e)=>e.preventDefault()}
              className="w-full h-full object-contain bg-white"
              style={{ pointerEvents:'none', userSelect:'none' }}
            />
          </div>

          {/* DER: Texto + CTA */}
          <div className="flex flex-col items-center md:items-start justify-center gap-3 md:gap-3.5 md:pl-5 md:border-l md:border-amber-200">
            <h2
              id="wk-welcome-title"
              className="font-extrabold text-2xl md:text-[28px] leading-tight tracking-tight text-center md:text-left"
              style={{
                backgroundImage:'linear-gradient(90deg,#b32b11 0%, #6c1e00 100%)',
                WebkitBackgroundClip:'text',
                backgroundClip:'text',
                color:'transparent'
              }}
            >
              ¡Gracias por unirte a la familia Waffle King!
            </h2>

            <div className="h-[3px] w-14 rounded-full" style={{background:'linear-gradient(90deg,#c28432,#b32b11)'}}/>

            <p className="text-sm md:text-[15px] text-[#4e3427] leading-relaxed text-center md:text-left">
              Aquí horneamos felicidad capa por capa. ¿List@ para crear tu waffle perfecto?
            </p>

            <button
              onClick={()=>closeWithAnim(onStart)}
              className="mt-0.5 inline-flex items-center justify-center rounded-full px-5 h-11 md:h-12 w-full md:w-[240px] font-bold text-white transition active:scale-[0.98]"
              style={{background:'linear-gradient(180deg,#3a1104,#2a0c02)', boxShadow:'0 8px 18px rgba(58,17,4,.22)'}}
            >
              Empezar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ===================================================================== */

/* ============ NUEVO: Modal “Tu pedido se quedó a medio antojo” ============ */
function ReminderModal({open,count,onClose,onGotoCart}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{ if(open){ setTimeout(()=>setVisible(true),0); } },[open]);
  if(!open) return null;

  const plural = (count||0)===1 ? "waffle esperando" : "waffles esperando";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="wk-reminder-title"
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.(); }}
      style={{background:'rgba(0,0,0,.45)'}}
    >
      <div
        className="relative bg-white rounded-2xl border-2 max-h-[80vh] overflow-visible"
        style={{
          borderColor:'#c28432',
          width:'min(92vw, 560px)',
          boxShadow:'0 20px 50px rgba(58,17,4,.28), 0 4px 18px rgba(58,17,4,.15)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(.98) translateY(6px)',
          opacity: visible ? 1 : 0,
          transition:'transform .2s ease, opacity .2s ease'
        }}
      >
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute h-9 w-9 rounded-full flex items-center justify-center z-10 top-2 right-2 md:-top-3 md:-right-3"
          style={{
            border:'2px solid #c28432',
            color:'#3a1104', background:'#fff',
            boxShadow:'0 6px 16px rgba(58,17,4,.22)'
          }}
        >×</button>

        {/* Texto a la IZQUIERDA, video a la DERECHA */}
        <div className="grid md:grid-cols-[1fr,220px] gap-4 p-4 md:p-5 items-center">
          {/* IZQ: Texto + botones */}
          <div className="flex flex-col items-start justify-center gap-3 md:gap-4 md:pr-5 md:border-r md:border-amber-200">
            <h2
              id="wk-reminder-title"
              className="font-extrabold text-xl md:text-[22px] leading-tight tracking-tight"
              style={{
                backgroundImage:'linear-gradient(90deg,#b32b11 0%, #6c1e00 100%)',
                WebkitBackgroundClip:'text',
                backgroundClip:'text',
                color:'transparent'
              }}
            >
              Tu pedido se quedó a medio antojo 🍓
            </h2>
            <p className="text-sm text-[#4e3427]">
              Tienes <b>{count}</b> {plural} en tu carrito. ¿Deseas retomarlo?
            </p>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={onGotoCart}
                className="inline-flex items-center justify-center rounded-full px-5 h-11 w-full sm:w-auto font-bold text-white transition active:scale-[0.98]"
                style={{background:'linear-gradient(180deg,#b32b11,#6c1e00)', boxShadow:'0 8px 18px rgba(58,17,4,.22)'}}
              >
                Ir al carrito
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full px-5 h-11 w-full sm:w-auto font-semibold"
                style={{background:'var(--wk-cream)', border:'2px solid #c28432', color:'#111'}}
              >
                Seguir comprando
              </button>
            </div>
          </div>

          {/* DER: Video */}
          <div
            className="rounded-xl border-2 overflow-hidden mx-auto md:mx-0 bg-white"
            style={{ borderColor:'#c28432', width:'200px', height:'240px', boxShadow:'0 8px 16px rgba(58,17,4,.06)' }}
          >
            <video
              src={REMINDER_VIDEO}
              poster={REMINDER_POSTER}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
              controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
              onContextMenu={(e)=>e.preventDefault()}
              className="w-full h-full object-contain bg-white"
              style={{ pointerEvents:'none', userSelect:'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ HEADER ============================ */
function Header({count}){
  return (<header className="sticky top-0 z-40 glass border-b border-amber-100/70">
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-2">
      <div className="flex items-center gap-3">
        <img src={LOGO} className="h-10 w-10 rounded-xl ring-1 ring-amber-200 object-contain" alt="Waffle King"/>
        <div className="leading-4">
          <h1 className="font-extrabold text-lg">Waffle King</h1>
          <p className="text-xs text-slate-700">Pedidos online — Lima Norte</p>
        </div>
        <button onClick={()=>location.href='checkout.html'} className="ml-auto relative rounded-full border border-amber-300 p-2 hover:bg-amber-50" aria-label="Ir al carrito">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6"><path fill="currentColor" d="M7 4h-2l-1 2h2l3.6 7.59l-1.35 2.45A1.99 1.99 0 0 0 10 19h9v-2h-9l1.1-2h7.45a2 2 0 0 0 1.79-1.11l3.58-6.49A1 1 0 0 0 23 5H6.21l-.94-2ZM7 20a2 2 0 1 0 4 0a2 2 0 0 0-4 0m8 0a 2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
          {count>0 && <span className="absolute -top-1 -right-1 bg-[#3a1104] text-white text-xs px-1.5 py-0.5 rounded-full">{count}</span>}
        </button>
      </div>
      <div className="mt-2 w-full">
        <div className="rounded-full border-2 border-[#c28432] bg-white text-black text-sm px-4 py-2">
          Pedidos con <b>24h</b> de anticipación.
        </div>
      </div>
    </div>
  </header>);
}

function Pill({used,total,label}){
  const ok=(used||0)<= (total||0);
  return <div className={"text-xs px-2 py-1 rounded-full border "+(ok?"border-amber-200 bg-amber-50 text-amber-900":"border-red-300 bg-red-50 text-red-700")}>{label}: {used||0}/{total||0} incl.</div>;
}

function Block({title,children,extra}){
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[#b32b11]">{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

/* ===== Modal de imagen referencial ===== */
function ImagePreview({src,title,onClose}){
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button className="btn-pill border focus:outline-none" onClick={onClose}>Cerrar</button>
        </div>
        <img src={src} alt={title} className="w-full h-auto object-cover"
             onError={(e)=>{e.target.style.display='none'; toast('No se encontró la imagen');}}/>
      </div>
    </div>
  );
}

function App(){
  useEffect(()=>{try{if(localStorage.getItem('wk_clear_delivery')==='1'){localStorage.removeItem('wk_delivery');localStorage.removeItem('wk_clear_delivery');}}catch(e){}},[]);

  const [packId,setPack]=useState(null);
  const pack=useMemo(()=>PACKS.find(p=>p.id===packId),[packId]);
  const [tops,setTops]=useState([]);
  const [masaId, setMasaId] = useState(null);
  const [sirs,setSirs]=useState([]);
  const [prem,setPrem]=useState(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
  const [notes,setNotes]=useState("");
  const [rec,setRec]=useState("");
  const [count,setCount]=useCartCount();
  const [qty,setQty]=useState(1);
  const locked=!pack;

  const [preview,setPreview]=useState(null);

  // Welcome: mostrar una vez por sesión, PERO nunca si hay carrito pendiente
  const [welcomeOpen,setWelcomeOpen]=useState(false);
  useEffect(()=>{
    try {
      const cart = JSON.parse(localStorage.getItem('wk_cart') || '[]');
      const cartHasItems = Array.isArray(cart) && cart.length > 0;
      if (cartHasItems) return; // no mostrar si hay carrito pendiente
    } catch(e){}
    const seen = sessionStorage.getItem('wk_welcome_seen')==='1';
    if(!seen){ setWelcomeOpen(true); sessionStorage.setItem('wk_welcome_seen','1'); }
  },[]);

  /* === NUEVO: abrir Reminder cada vez que se entra si hay carrito con cantidad > 0 === */
  const [reminderOpen,setReminderOpen]=useState(false);
  useEffect(()=>{
    try{
      const list = JSON.parse(localStorage.getItem('wk_cart')||'[]');
      const qty  = Array.isArray(list) ? list.reduce((a,b)=>a+(+b.qty||0),0) : 0;
      if(qty>0) setReminderOpen(true);
    }catch(e){}
  },[]);

  useEffect(()=>{
    setTops([]);setSirs([]);setQty(1);setMasaId(null);
    setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
    setNotes(""); setRec("");
  },[packId]);

  const sirsExtra=locked?0:sirs.reduce((a,id)=>a+(SIROPES.find(s=>s.id===id)?.extra||0),0);
  const premCost=locked?0:Object.entries(prem).reduce((a,[id,q])=>a+(PREMIUM.find(p=>p.id===id)?.price||0)*(+q||0),0);
  const masaDelta = masaId ? (MASAS.find(m => m.id === masaId)?.delta || 0) : 0;
  const unit = locked ? 0 : ((pack?.price || 0) + masaDelta + sirsExtra + premCost);
  const total=locked?0:(unit*qty);

  function requirePack(){ if(locked){ toast("Debes seleccionar un waffle para continuar"); return true; } return false; }

  const ACTIVE_BOX =
    "border-2 border-[#c28432] bg-[linear-gradient(180deg,rgba(194,132,50,0.06),rgba(194,132,50,0.10)),#ffffff]";
  const FOCUS_OFF = "focus:outline-none focus:ring-0";

  function toggle(list,setter,limit,id){
    if(requirePack())return;
    setter(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : (prev.length<limit?[...prev,id]:prev));
  }
  function setPremium(id,d){ if(requirePack())return; setPrem(prev=>({...prev,[id]:Math.max(0,(+prev[id]||0)+d)})) }

  function add(){
    if(requirePack())return;
    if (!masaId) {toast("Selecciona el tipo de masa"); return;}
    if(qty<1){toast("Cantidad inválida");return;}
    const item={
      name:pack.name,packId:pack.id,basePrice:pack.price,incTop:pack.incTop,incSir:pack.incSir,
      masaId, masaName: (MASAS.find(m => m.id === masaId)?.name || "Clásica (harina de trigo)"),masaDelta,
      toppings:TOPS.filter(t=>tops.includes(t.id)).map(t=>t.name),
      siropes:SIROPES.filter(s=>sirs.includes(s.id)).map(s=>({name:s.name,extra:s.extra||0})),
      premium:PREMIUM.filter(p=>(+prem[p.id]||0)>0).map(p=>({name:p.name,price:p.price,qty:+prem[p.id]})),
      recipient:rec, notes:notes, unitPrice:unit,qty:qty
    };
    const cart=JSON.parse(localStorage.getItem("wk_cart")||"[]");
    cart.push(item);
    localStorage.setItem("wk_cart",JSON.stringify(cart));
    setPack(null); setTops([]); setSirs([]);
    setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0]))); setQty(1);
    setNotes(""); setRec("");
    setCount(cart.reduce((a,b)=>a+(+b.qty||0),0));
    toast("Agregado al carrito");

    // ⬆️ Mover scroll al inicio tras agregar
    setTimeout(()=>window.scrollTo({top:0, behavior:'smooth'}), 50);
  }

  return (<div>
    {/* MODAL DE RECORDATORIO (texto izquierda, video derecha) */}
    <ReminderModal
      open={reminderOpen}
      count={count}
      onClose={()=>setReminderOpen(false)}
      onGotoCart={()=>{ setReminderOpen(false); location.href='checkout.html'; }}
    />

    {/* MODAL DE BIENVENIDA */}
    <WelcomeModal
      open={welcomeOpen}
      onClose={()=>setWelcomeOpen(false)}
      onStart={()=>{
        setWelcomeOpen(false);
        setTimeout(()=>window.scrollTo({top:0, behavior:'smooth'}), 10);
      }}
    />

    <Header count={count}/>
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ============ PACKS ============ */}
      <Block title="Elige tu waffle">
        <div id="packs-start" />
        <div className="grid md:grid-cols-2 gap-3">
          {PACKS.map(p=>(
            <button
              key={p.id}
              onClick={()=>setPack(p.id)}
              className={
                "text-left rounded-2xl border p-4 w-full " + FOCUS_OFF + " " +
                (p.id===packId ? ACTIVE_BOX : "border-slate-200 bg-white/80 hover:bg-white")
              }
              aria-label={`Elegir ${p.name}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={p.id===packId ? "font-bold" : "font-medium"}>{p.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>
                  <button
                    onClick={(e)=>{e.stopPropagation(); setPreview({src:p.img,title:p.name});}}
                    className={"mt-2 inline-flex items-center gap-1 text-xs text-amber-800 underline underline-offset-2 decoration-amber-300 hover:decoration-amber-600 " + FOCUS_OFF}
                    aria-label={`Ver imagen referencial de ${p.name}`}
                    title="Foto referencial"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path fill="currentColor" d="M21 19V5H3v14h18ZM21 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18ZM8 11l2.03 2.71l2.72-3.62L16 14h-8Z"/>
                    </svg>
                    <span>Foto referencial</span>
                  </button>
                </div>
                <div className="flex items-center">
                  <div className="font-bold whitespace-nowrap">{soles(p.price)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!pack && <div className="mt-2 text-xs text-slate-600">Selecciona un waffle para desbloquear los siguientes pasos.</div>}
      </Block>

      {/* ============ MASA ============ */}
      <Block title="Tipo de masa">
        <div className={"grid sm:grid-cols-2 gap-2 " + (locked ? "opacity-60 pointer-events-none" : "")}>
          {MASAS.map(m => {
            const active = masaId === m.id;
            return (
              <button
                key={m.id}
                onClick={()=> setMasaId(m.id)}
                className={
                  "text-left rounded-xl border px-3 py-2 " + FOCUS_OFF + " " +
                  (active ? ACTIVE_BOX : "border-slate-200 bg-white")
                }
                title={locked ? "Debes seleccionar un waffle para continuar" : ""}
              >
                <div className="flex items-center justify-between">
                  <span className={active ? "font-semibold" : ""}>{m.name}</span>
                  {m.delta > 0 && <span className="text-xs">+{soles(m.delta)}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Block>

      {/* ============ TOPPINGS ============ */}
      <Block title="Toppings incluidos" extra={<Pill used={tops.length} total={pack?.incTop} label="Toppings"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {TOPS.map(t=>{
            const active=tops.includes(t.id);
            const dis=!active && (tops.length>=(pack?.incTop||0));
            return (
              <button
                key={t.id}
                onClick={()=>toggle(tops,setTops,pack?.incTop||0,t.id)}
                className={
                  "text-left rounded-xl border px-3 py-2 " + FOCUS_OFF + " " +
                  (active?ACTIVE_BOX:"border-slate-200 bg-white") +
                  (dis?" opacity-50 cursor-not-allowed":"")
                }
                title={locked?"Debes seleccionar un waffle para continuar":""}
              >
                <div className="flex items-center justify-between">
                  <span className={active ? "font-semibold" : ""}>{t.name}</span>
                  {active && <span className="text-xs text-[#3a1104]">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Block>

      {/* ============ SIROPES ============ */}
      <Block title="Siropes incluidos" extra={<Pill used={sirs.length} total={pack?.incSir} label="Siropes"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {SIROPES.map(s=>{
            const active=sirs.includes(s.id);
            const dis=!active && (sirs.length>=(pack?.incSir||0));
            return (
              <button
                key={s.id}
                onClick={()=>toggle(sirs,setSirs,pack?.incSir||0,s.id)}
                className={
                  "text-left rounded-xl border px-3 py-2 " + FOCUS_OFF + " " +
                  (active?ACTIVE_BOX:"border-slate-200 bg-white") +
                  (dis?" opacity-50 cursor-not-allowed":"")
                }
                title={locked?"Debes seleccionar un waffle para continuar":""}
              >
                <div className="flex items-center justify-between">
                  <span className={active ? "font-semibold" : ""}>
                    {s.name}{s.extra?` (+${soles(s.extra)})`:""}
                  </span>
                  {active && <span className="text-xs text-[#3a1104]">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-2">* Hersheys agrega S/ 2.00 al total aunque esté dentro del pack.</p>
      </Block>

      {/* ============ PREMIUM ============ */}
      <Block title="Toppings Premium (opcional)">
        <div className={"grid md:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {PREMIUM.map(p=>(
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2" title={locked?"Debes seleccionar un waffle para continuar":""}>
              <div className="flex items-center justify-between">
                <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-600">+ {soles(p.price)} c/u</div></div>
                <div className="flex items-center gap-2">
                  <button className={"px-2 py-1 rounded-full border "+FOCUS_OFF} onClick={()=>setPremium(p.id,-1)}>−</button>
                  <span className="w-8 text-center">{locked?0:(prem[p.id]||0)}</span>
                  <button className={"px-2 py-1 rounded-full border "+FOCUS_OFF} onClick={()=>setPremium(p.id,1)}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* ============ RESUMEN ============ */}
      <Block title="Dedicatoria y destinatario">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Para (nombre)</label>
            <input value={rec} onChange={e=>setRec(e.target.value.slice(0,60))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:outline-none" placeholder="Ej: Mackey"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium">Mensaje/Dedicatoria (opcional)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,180))} className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:outline-none" rows="3" placeholder="Ej: Para Mackey con mucho amor. ¡Feliz cumple!"></textarea>
            <div className="text-xs text-slate-500 mt-1">{notes.length}/180</div></div>
        </div>
      </Block>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">Total del waffle</span>
            <span className="text-lg font-bold">{soles(total)}</span>
            <span className="text-xs text-slate-600">{!pack?"(selecciona un waffle)":"("+soles(unit)+" c/u)"}</span>
          </div>
          <div className="text-xs text-slate-600">Base del pack + sirope(s) con extra + premium seleccionados.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className={"px-3 py-2 rounded-full border "+FOCUS_OFF} onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={!pack} title={!pack?"Debes seleccionar un waffle para continuar":""}>−</button>
          <span className="w-10 text-center font-semibold">{!pack?0:qty}</span>
          <button className={"px-3 py-2 rounded-full border "+FOCUS_OFF} onClick={()=>setQty(q=>q+1)} disabled={!pack} title={!pack?"Debes seleccionar un waffle para continuar":""}>+</button>

          {/* BOTÓN ACTUALIZADO */}
          <button
            onClick={add}
            disabled={!pack}
            className={
              "btn-pill text-white " + FOCUS_OFF + " " +
              (!pack ? "btn-disabled" : "hover:bg-[#2a0c02]")
            }
            style={
              !pack
                ? {
                    background:'linear-gradient(180deg, rgba(58,17,4,0.62), rgba(58,17,4,0.46))',
                    opacity:1,
                    boxShadow:'0 6px 14px rgba(58,17,4,.18)'
                  }
                : { background:'#3a1104' }
            }
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </main>

    {/* Modal ver foto */}
    {preview && <ImagePreview src={preview.src} title={preview.title} onClose={()=>setPreview(null)}/>}
  </div>);
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

