const {useState,useMemo,useEffect}=React;
const LOGO="assets/logo.png";

// Presentaciones (2): mantiene precios existentes (25 y 40)
const PACKS=[
  {id:"special",name:"Waffle Especial",price:25,incTop:3,incSir:2,desc:"Incluye 2 siropes + 3 toppings + dedicatoria"},
  {id:"king",name:"Waffle King (2 pisos)",price:40,incTop:4,incSir:3,desc:"Incluye 3 siropes + 4 toppings + dedicatoria"},
];

// Tipo de masa (nuevo): +S/5 si eligen avena
const MASAS=[
  {id:"clasica",name:"Clásica (harina de trigo)",delta:0},
  {id:"avena",name:"Avena",delta:5},
];

// Toppings incluidos (nueva lista)
const TOPS=[
  {id:"t-fresa",name:"Fresa"},
  {id:"t-platano",name:"Plátano"},
  {id:"t-oreo",name:"Oreo"},
  {id:"t-sublime",name:"Sublime"},
  {id:"t-princesa",name:"Princesa"},
  {id:"t-cua",name:"Cua Cua"},
  {id:"t-obsesion",name:"Obsesión"},
];

// Siropes (sin cambios en lógica)
const SIROPES=[
  {id:"s-maple",name:"Miel de maple",extra:0},
  {id:"s-fresa",name:"Jarabe de fresa",extra:0},
  {id:"s-dulce",name:"Dulce de leche",extra:0},
  {id:"s-fudge",name:"Fudge",extra:0},
  {id:"s-hers",name:"Hersheys",extra:2}, // cobra +2 aunque esté incluido
];

// Premium (igual; solo cambia el título en UI a “(opcional)”)
const PREMIUM=[
  {id:"p-kiwi",name:"Kiwi",price:3},
  {id:"p-duraznos",name:"Duraznos",price:3},
  {id:"p-pinguinito",name:"Pingüinito",price:3},
  {id:"p-snickers",name:"Snickers",price:5},
  {id:"p-brownie",name:"Brownie",price:3},
  {id:"p-mms",name:"M&M",price:5},
  {id:"p-kitkat",name:"Kit Kat",price:5},
  {id:"p-hersheysp",name:"Hersheys",price:5},
  {id:"p-ferrero",name:"Ferrero Rocher",price:5},
];

const soles=n=>"S/ "+(Math.round(n*100)/100).toFixed(2);
function toast(m){
  const t=document.getElementById("toast");
  t.textContent=m;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1300);
}

function useCartCount(){
  const [c,setC]=useState(()=>JSON.parse(localStorage.getItem('wk_cart')||"[]").reduce((a,b)=>a+(b.qty||1),0));
  useEffect(()=>{
    const on=()=>setC(JSON.parse(localStorage.getItem('wk_cart')||"[]").reduce((a,b)=>a+(b.qty||1),0));
    window.addEventListener("storage",on);
    return()=>window.removeEventListener("storage",on)
  },[]);
  return[c,setC]
}

function Header({count}){
  return (
    <header className="sticky top-0 z-40 glass border-b border-amber-100/70">
      <div className="max-w-5xl mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <img src={LOGO} className="h-10 w-10 rounded-xl ring-1 ring-amber-200 object-contain"/>
          <div className="leading-4">
            <h1 className="font-extrabold text-base">Waffle King</h1>
            <p className="text-xs text-slate-700">Pedidos online — Lima Norte</p>
          </div>
          <button
            onClick={()=>location.href='checkout.html'}
            className="relative ml-auto rounded-xl ring-1 ring-amber-200 border border-amber-300 p-2 hover:bg-amber-50"
            aria-label="Ir al carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M2 3a1 1 0 0 1 1-1h1.6a1 1 0 0 1 .98.804L6 5h11a1 1 0 0 1 .98 1.196l-1.5 7A2 2 0 0 1 14.52 15H8.48a2 2 0 0 1-1.96-1.804L5.2 5.8a1 1 0 0 1-.98-.8L3 4H3a1 1 0 0 1-1-1Z"/>
              <path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
            </svg>
            {count>0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">{count}</span>}
          </button>
        </div>

        {/* Quitado “entrega fines de semana” — dejamos solo 24h */}
        <div className="mt-2 w-full">
          <div className="rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-sm px-4 py-2">
            Pedidos con <b>24h</b> de anticipación.
          </div>
        </div>
      </div>
    </header>
  );
}

function Pill({used,total,label}){
  const ok=(used||0)<= (total||0);
  const cls="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs "
    +(ok?"bg-emerald-50 border-emerald-300 text-emerald-900":"bg-amber-50 border-amber-300 text-amber-900");
  return (
    <span className={cls}>
      <span className="font-semibold">{label}</span>
      <span className="rounded-full bg-white px-2 py-0.5 shadow-soft">{used||0}/{total||0}</span>
    </span>
  )
}

function Block({title,children,extra}){
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>{extra}
      </div>
      {children}
    </div>
  )
}

function Action({children,disabled,onClick,primary}){
  const cls="btn-pill "
    +(primary?"bg-black text-white hover:opacity-90":"ring-1 ring-amber-200 border border-amber-300 hover:bg-amber-50")
    +(disabled?" btn-disabled":"");
  return <button disabled={disabled} onClick={onClick} className={cls}>{children}</button>
}

function App(){
  // limpiar delivery guardado cuando vuelves del checkout
  useEffect(()=>{
    try{
      if(localStorage.getItem('wk_clear_delivery')){
        localStorage.removeItem('wk_delivery');
        localStorage.removeItem('wk_clear_delivery');
      }
    }catch(e){}
  },[]);

  const [packId,setPack]=useState(null);
  const pack=useMemo(()=>PACKS.find(p=>p.id===packId),[packId]);

  const [tops,setTops]=useState([]);
  const [sirs,setSirs]=useState([]);
  const [prem,setPrem]=useState(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
  const [notes,setNotes]=useState("");
  const [rec,setRec]=useState("");
  const [count,setCount]=useCartCount();
  const [qty,setQty]=useState(1);

  // masa (nuevo)
  const [masaId,setMasaId]=useState("clasica");

  const locked=!pack;

  // reset al cambiar pack (misma lógica existente)
  useEffect(()=>{
    setTops([]); setSirs([]); setQty(1);
    setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
    setNotes(""); setRec("");
    setMasaId("clasica"); // por defecto
  },[packId]);

  function toggle(list,set,el){
    if(list.includes(el)) set(list.filter(i=>i!==el));
    else set([...list,el]);
  }
  function inc(obj,set,id){ set({...obj,[id]:(+obj[id]||0)+1}) }
  function dec(obj,set,id){ set({...obj,[id]:Math.max(0,(+obj[id]||0)-1)}) }
  function requirePack(){
    if(!pack){ toast("Debes seleccionar un waffle para continuar"); return true }
    return false;
  }

  const sirsExtra=useMemo(()=>SIROPES.filter(s=>sirs.includes(s.id)).reduce((a,s)=>a+(s.extra||0),0),[sirs]);
  const premCost=useMemo(()=>Object.entries(prem).reduce((a,[id,qty])=>{
    return a+((PREMIUM.find(p=>p.id===id)?.price||0)*(+qty||0))
  },0),[prem]);

  const masaDelta=(MASAS.find(m=>m.id===masaId)?.delta||0);

  // MISMA LÓGICA + delta por masa
  const unit=locked?0:((pack?.price||0)+masaDelta+sirsExtra+premCost);
  const total=locked?0:(unit*qty);

  function add(){
    if(requirePack()) return;
    if(qty<1){ toast("Cantidad inválida"); return; }

    const item={
      name:pack.name,
      packId:pack.id,
      basePrice:pack.price,
      incTop:pack.incTop,
      incSir:pack.incSir,

      // masa guardada en el ítem (no rompe nada)
      masaId,
      masaName:(MASAS.find(m=>m.id===masaId)?.name||"Clásica"),
      masaDelta,

      toppings:TOPS.filter(t=>tops.includes(t.id)).map(t=>t.name),
      siropes:SIROPES.filter(s=>sirs.includes(s.id)).map(s=>({name:s.name,extra:s.extra||0})),
      premium:PREMIUM.filter(p=>(+prem[p.id]||0)>0).map(p=>({name:p.name,price:p.price,qty:+prem[p.id]})),

      recipient:rec,
      notes:notes,
      unitPrice:unit,
      qty:qty
    };

    const cart=JSON.parse(localStorage.getItem('wk_cart')||"[]");
    cart.push(item);
    localStorage.setItem('wk_cart',JSON.stringify(cart));

    setCount(c=>c+(qty||1));
    toast("Agregado al carrito");

    // limpiar al final (misma lógica)
    setPack(null);
    setTops([]);
    setSirs([]);
    setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
    setNotes("");
    setRec("");
    setQty(1);
    setMasaId("clasica");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <Header count={count}/>

      {/* 1) Elige tu waffle (solo 2 presentaciones) */}
      <Block title="Elige tu waffle">
        <div className="grid sm:grid-cols-2 gap-3">
          {PACKS.map(p=>(
            <button
              key={p.id}
              onClick={()=>setPack(p.id)}
              className={"rounded-2xl border p-3 text-left "+(packId===p.id?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{p.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>
                </div>
                <div className="font-bold">{soles(p.price)}</div>
              </div>
            </button>
          ))}
        </div>
        {!pack && <div className="mt-2 text-xs text-slate-600">Selecciona un waffle para desbloquear los siguientes pasos.</div>}
      </Block>

      {/* 2) Tipo de masa (nuevo) */}
      <Block title="Tipo de masa">
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {MASAS.map(m=>(
            <label
              key={m.id}
              className={"flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer "+(masaId===m.id?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")}
              title={locked?"Debes seleccionar un waffle para continuar":""}
            >
              <div className="flex items-center gap-2">
                <input type="radio" name="masa" checked={masaId===m.id} onChange={()=>setMasaId(m.id)} />
                <span>{m.name}</span>
              </div>
              {m.delta>0 && <span className="text-xs">+S/ {m.delta.toFixed(2)}</span>}
            </label>
          ))}
        </div>
      </Block>

      {/* 3) Toppings incluidos (lista nueva; misma lógica de conteo) */}
      <Block title="Toppings incluidos" extra={<Pill used={tops.length} total={pack?.incTop} label="Toppings"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {TOPS.map(t=>{
            const active=tops.includes(t.id);
            const dis=!active && (tops.length>=(pack?.incTop||0));
            return (
              <button
                key={t.id}
                onClick={()=>toggle(tops,setTops,t.id)}
                className={"rounded-xl border px-3 py-2 text-left "+(active?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}
                title={locked?"Debes seleccionar un waffle para continuar":""}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.name}</div>
                  {active && <span className="text-xs text-amber-700">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Block>

      {/* 4) Siropes incluidos (igual) */}
      <Block title="Siropes incluidos" extra={<Pill used={sirs.length} total={pack?.incSir} label="Siropes"/>}>
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {SIROPES.map(s=>{
            const active=sirs.includes(s.id);
            const dis=!active && (sirs.length>=(pack?.incSir||0));
            return (
              <button
                key={s.id}
                onClick={()=>toggle(sirs,setSirs,s.id)}
                className={"rounded-xl border px-3 py-2 text-left "+(active?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}
                title={locked?"Debes seleccionar un waffle para continuar":""}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  {(s.extra||0)>0 && <span className="text-xs">+{soles(s.extra)}</span>}
                </div>
                {active && <div className="text-xs text-amber-700 mt-1">✓ Seleccionado {s.extra?`(+${soles(s.extra)} extra)`:''}</div>}
              </button>
            );
          })}
        </div>
      </Block>

      {/* 5) Premium (mismo comportamiento; título con “(opcional)”) */}
      <Block title="Toppings Premium (opcional)">
        <div className={"grid sm:grid-cols-2 gap-2 "+(locked?"opacity-60 pointer-events-none":"")}>
          {PREMIUM.map(p=>{
            const q=+prem[p.id]||0;
            return (
              <div key={p.id} className={"rounded-xl border px-3 py-2 "+(q>0?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm">{soles(p.price)}</div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={()=>dec(prem,setPrem,p.id)} className="rounded-lg border px-2 py-1">-</button>
                  <span className="min-w-[2ch] text-center">{q}</span>
                  <button onClick={()=>inc(prem,setPrem,p.id)} className="rounded-lg border px-2 py-1">+</button>
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      {/* Dedicatoria (igual) */}
      <Block title="Dedicatoria y destinatario">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Para (nombre)</label>
            <input value={rec} onChange={e=>setRec(e.target.value.slice(0,40))} className="w-full rounded-lg border border-slate-300 p-2" placeholder="Ej: Mackey"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Mensaje/Dedicatoria (opcional)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,180))} className="w-full rounded-lg border border-slate-300 p-2" rows="3" placeholder="Ej: Para Mackey con mucho amor. ¡Feliz cumple!"></textarea>
            <div className="text-xs text-slate-500 mt-1">{notes.length}/180</div>
          </div>
        </div>
      </Block>

      {/* Totales + acciones (igual, sumando masaDelta en unit) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <b>Unitario:</b> {soles(unit)} {qty>1 && <span className="ml-2">• <b>Total:</b> {soles(total)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Action onClick={()=>{
            setPack(null);
            setTops([]);
            setSirs([]);
            setPrem(Object.fromEntries(PREMIUM.map(p=>[p.id,0])));
            setNotes("");
            setRec("");
            setQty(1);
            setMasaId("clasica");
          }}>Limpiar</Action>
          <Action primary onClick={add} disabled={!pack}>Agregar al carrito</Action>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-4">Tu carrito se guardará automáticamente.</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

