/* global React, ReactDOM */
const {useState,useMemo,useEffect}=React;

const LOGO="assets/logo.png";

/* ============ Packs (con imagen referencial) ============ */
const PACKS = [
  { id:"special", name:"Waffle Especial (1 piso)", price:25, incTop:3, incSir:2, desc:"Incluye 3 toppings + 2 siropes + dedicatoria", img:"assets/ref-special.jpg" },
  { id:"king",    name:"Waffle King (2 pisos)",    price:45, incTop:4, incSir:3, desc:"Incluye 4 toppings + 3 siropes + dedicatoria", img:"assets/ref-king.jpg" },
];

const MASAS = [
  { id:"clasica", name:"Clásica (harina de trigo)", delta:0 },
  { id:"fitness", name:"Fitness (avena)",           delta:5 },
];

const TOPS = [
  { id:"t-fresa",     name:"Fresa" },
  { id:"t-platano",   name:"Plátano" },
  { id:"t-oreo",      name:"Oreo" },
  { id:"t-sublime",   name:"Sublime" },
  { id:"t-princesa",  name:"Princesa" },
  { id:"t-cua",       name:"Cua Cua" },
  { id:"t-obsesion",  name:"Obsesión" },
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

function useCartCount(){const [c,setC]=useState(()=>JSON.parse(localStorage.getItem("wk_cart")||"[]").reduce((a,b)=>a+b.qty,0));useEffect(()=>{const on=()=>setC(JSON.parse(localStorage.getItem("wk_cart")||"[]").reduce((a,b)=>a+b.qty,0));window.addEventListener("storage",on);return()=>window.removeEventListener("storage",on)},[]);return[c,setC]}

function Header({count}){
  return (<header className="sticky top-0 z-40 glass border-b border-amber-100/70">
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-2">
      <div className="flex items-center gap-3">
        <img src={LOGO} className="h-10 w-10 rounded-xl ring-1 ring-amber-200 object-contain"/>
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
  return <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft">
    <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{title}</h3>{extra}</div>{children}
  </div>;
}

/* ===== Modal de imagen referencial ===== */
function ImagePreview({src,title,onClose}){
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button className="btn-pill border" onClick={onClose}>Cerrar</button>
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

  // preview de imagen
  const [preview,setPreview]=useState(null); // {src,title} | null

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

  function toggle(list,setter,limit,id){
    if(requirePack())return;
    setter(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : (prev.length<limit?[...prev,id]:prev));
  }
  function setPremium(id,d){ if(requirePack())return; setPrem(prev=>({...prev,[id]:Math.max(0,(+prev[id]||0)+d)})) }

  function add(){
    if(requirePack())return;
    if (!masaId) {toast("Selecciona el tipo de masa"); return;}
    if(qty<1){toast("Cantidad inválida");return;}
    const item={name:pack.name,packId:pack.id,basePrice:pack.price,incTop:pack.incTop,incSir:pack.incSir,masaId, masaName: (MASAS.find(m => m.id === masaId)?.name || "Clásica (harina de trigo)"),masaDelta,
      toppings:TOPS.filter(t=>tops.includes(t.id)).map(t=>t.name),
      siropes:SIROPES.filter(s=>sirs.includes(s.id)).map(s=>({name:s.name,extra:s.extra||0})),
      premium:PREMIUM.filter(p=>(+prem[p.id]||0)>0).map(p=>({name:p.name,price:p.price,qty:+prem[p.id]})),
      recipient:rec, notes:notes,
      unitPrice:unit,qty:qty};
    const cart=JSON.parse(localStorage.getItem("wk_cart")||"[]");
    cart.push(item);
    localStorage.setItem("wk_cart",JSON.stringify(cart));
    setPack(null); setTops([]); setSirs([]);
    setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0]))); setQty(1);
    setNotes(""); setRec("");
    setCount(cart.reduce((a,b)=>a+b.qty,0));
    toast("Agregado al carrito");
  }

  // ===== Clases para "seleccionado": borde marrón intenso + fondo suave tintado
  const ACTIVE_BOX = "border-2 border-[#3a1104] bg-[rgba(58,17,4,0.08)]";

  return (<div>
    <Header count={count}/>
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <Block title="Elige tu waffle">
        <div className="grid md:grid-cols-2 gap-3">
          {PACKS.map(p=>(
            <button
              key={p.id}
              onClick={()=>setPack(p.id)}
              className={
                "text-left rounded-2xl border p-4 w-full " +
                (p.id===packId ? ACTIVE_BOX : "border-slate-200 bg-white/80 hover:bg-white")
              }
            >
              <div className="flex items-start justify-between">
                {/* Izquierda: nombre + desc + link */}
                <div>
                  <h4 className="font-semibold">{p.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>

                  <button
                    onClick={(e)=>{e.stopPropagation(); setPreview({src:p.img,title:p.name});}}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-amber-800 underline underline-offset-2 decoration-amber-300 hover:decoration-amber-600"
                    aria-label={`Ver imagen referencial de ${p.name}`}
                    title="Foto referencial"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path fill="currentColor" d="M21 19V5H3v14h18ZM21 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18ZM8 11l2.03 2.71l2.72-3.62L16 14h-8Z"/>
                    </svg>
                    <span>Foto referencial</span>
                  </button>
                </div>

                {/* Derecha: precio compacto */}
                <div className="flex items-center">
                  <div className="font-bold whitespace-nowrap">{soles(p.price)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!pack && <div className="mt-2 text-xs text-slate-600">Selecciona un waffle para desbloquear los siguientes pasos.</div>}
      </Block>

      <Block title="Tipo de masa">
        <div className={"grid sm:grid-cols-2 gap-2 " + (locked ? "opacity-60 pointer-events-none" : "")}>
          {MASAS.map(m => {
            const active = masaId === m.id;
            return (
              <button
                key={m.id}
                onClick={()=> setMasaId(m.id)}
                className={
                  "text-left rounded-xl border px-3 py-2 " +
                  (active ? ACTIVE_BOX : "border-slate-200 bg-white")
                }
                title={locked ? "Debes seleccionar un waffle para continuar" : ""}
              >
                <div className="flex items-center justify-between">
                  <span>{m.name}</span>
                  {m.delta > 0 && <span className="text-xs">+{soles(m.delta)}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Block>

      <Block title="Toppings incluidos" extra={<Pill used={tops.length} total={pack?.incTop} label="Toppings"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {TOPS.map(t=>{const active=tops.includes(t.id);const dis=!active && (tops.length>=(pack?.incTop||0));
            return <button key={t.id} onClick={()=>toggle(tops,setTops,pack?.incTop||0,t.id)} className={"text-left rounded-xl border px-3 py-2 "+(active?ACTIVE_BOX:"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}
              title={locked?"Debes seleccionar un waffle para continuar":""}>
              <div className="flex items-center justify-between">
                <span>{t.name}</span>
                {active && <span className="text-xs text-[#3a1104]">✓</span>}
              </div>
            </button>;
          })}
        </div>
      </Block>

      <Block title="Siropes incluidos" extra={<Pill used={sirs.length} total={pack?.incSir} label="Siropes"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {SIROPES.map(s=>{const active=sirs.includes(s.id);const dis=!active && (sirs.length>=(pack?.incSir||0));
            return <button key={s.id} onClick={()=>toggle(sirs,setSirs,pack?.incSir||0,s.id)} className={"text-left rounded-xl border px-3 py-2 "+(active?ACTIVE_BOX:"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}
              title={locked?"Debes seleccionar un waffle para continuar":""}>
              <div className="flex items-center justify-between">
                <span>{s.name}{s.extra?` (+${soles(s.extra)})`:""}</span>
                {active && <span className="text-xs text-[#3a1104]">✓</span>}
              </div>
            </button>;
          })}
        </div>
        <p className="text-xs text-slate-600 mt-2">* Hersheys agrega S/ 2.00 al total aunque esté dentro del pack.</p>
      </Block>

      <Block title="Toppings Premium (opcional)">
        <div className={"grid md:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {PREMIUM.map(p=>(
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2" title={locked?"Debes seleccionar un waffle para continuar":""}>
              <div className="flex items-center justify-between">
                <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-600">+ {soles(p.price)} c/u</div></div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,-1)}>−</button>
                  <span className="w-8 text-center">{locked?0:(prem[p.id]||0)}</span>
                  <button className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,1)}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Dedicatoria y destinatario">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Para (nombre)</label>
            <input value={rec} onChange={e=>setRec(e.target.value.slice(0,60))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" placeholder="Ej: Mackey"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium">Mensaje/Dedicatoria (opcional)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,180))} className="mt-1 w-full rounded-lg border border-slate-300 p-3" rows="3" placeholder="Ej: Para Mackey con mucho amor. ¡Feliz cumple!"></textarea>
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
          <button className="px-3 py-2 rounded-full border" onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={!pack} title={!pack?"Debes seleccionar un waffle para continuar":""}>−</button>
          <span className="w-10 text-center font-semibold">{!pack?0:qty}</span>
          <button className="px-3 py-2 rounded-full border" onClick={()=>setQty(q=>q+1)} disabled={!pack} title={!pack?"Debes seleccionar un waffle para continuar":""}>+</button>
          <button
            onClick={add}
            disabled={!pack}
            className={
              "btn-pill text-white " +
              (!pack ? "btn-disabled bg-amber-400" : "bg-[#3a1104] hover:bg-[#2a0c02]")
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

