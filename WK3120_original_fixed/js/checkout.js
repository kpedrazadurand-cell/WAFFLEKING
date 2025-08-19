const {useState,useEffect}=React;
const LOGO="assets/logo.png";const QR="assets/yape-qr.png";
const YAPE="957285316";const NOMBRE_TITULAR="Kevin R. Pedraza D.";
const WHA="51957285316";const DELIVERY=7;
// === Registro en Google Sheets ===
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyT6ie7aLa-fN0MQsNOVzTVNr6Al1D85ZKBbs6N0prxRy8C9YGmOsaAgGcd17kavmdiPw/exec';
const soles=n=>"S/ "+(Math.round(n*100)/100).toFixed(2);
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.classList.remove("show");void t.offsetWidth;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400)}

async function copyText(text,setCopied){
  try{ await navigator.clipboard.writeText(text); setCopied(true); }
  catch(e){
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); setCopied(true);}catch(_){}
    document.body.removeChild(ta);
  }
  setTimeout(()=>setCopied(false),1600);
}

// Header now receives callback in props so we can persist before navigating
function HeaderMini({onSeguir}){
  return (<header className="sticky top-0 z-40 glass border-b border-amber-100/70">
    <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
      <div className="flex items-center gap-3">
        <img src={LOGO} className="h-9 w-9 rounded-xl ring-1 ring-amber-200 object-contain"/>
        <div className="flex-1">
          <div className="font-semibold text-amber-900 text-sm">Waffle King</div>
          <div className="text-xs text-amber-700/80">Checkout</div>
        </div>
        <button onClick={onSeguir} className="btn-pill text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">
          Seguir comprando
        </button>
      </div>
    </div>
  </header>);
}

function PhoneInput({value,onChange}){
  const [val,setVal]=useState((value||"").replace(/\D/g,"").slice(-9));
  useEffect(()=>{ setVal((value||"").replace(/\D/g,"").slice(-9)); },[value]);
  function handle(e){
    const digits = e.target.value.replace(/\D/g,"").slice(0,9);
    setVal(digits);
    onChange(digits);
  }
  const preview = val.length===9 ? `+51 ${val.slice(0,3)} ${val.slice(3,6)} ${val.slice(6)}` : "";
  return (<div>
    <input value={val} onChange={handle} inputMode="numeric" maxLength={9}
      className="w-full input-pill" placeholder="Teléfono (9 dígitos)"/>
    <div className="text-[11px] text-amber-700/70 mt-1 h-4">{preview}</div>
  </div>);
}

function DatosEntrega({state,setState}){
  const [copied,setCopied]=useState(false);
  return (<section className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
    <h2 className="font-semibold text-amber-900 mb-2">Datos de entrega</h2>
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Nombre y apellidos</label>
        <input value={state.nombre} onChange={e=>setState(s=>({...s,nombre:e.target.value}))} className="w-full input-pill" placeholder="Ej. Juan Pérez"/>
      </div>
      <div>
        <label className="label">Teléfono</label>
        <PhoneInput value={state.telefono} onChange={v=>setState(s=>({...s,telefono:v}))}/>
      </div>
      <div>
        <label className="label">Distrito</label>
        <input value={state.distrito} onChange={e=>setState(s=>({...s,distrito:e.target.value}))} className="w-full input-pill" placeholder="Ej. San Borja"/>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input value={state.direccion} onChange={e=>setState(s=>({...s,direccion:e.target.value}))} className="w-full input-pill" placeholder="Calle / número / referencia breve"/>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Referencia</label>
        <input value={state.referencia} onChange={e=>setState(s=>({...s,referencia:e.target.value}))} className="w-full input-pill" placeholder="Frente a... (opcional)"/>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Link de Google Maps</label>
        <div className="flex gap-2">
          <input value={state.mapLink} onChange={e=>setState(s=>({...s,mapLink:e.target.value}))} className="flex-1 input-pill" placeholder="Pega el enlace del mapa (opcional)"/>
          <button onClick={()=>copyText(state.mapLink||"",setCopied)} className="btn-pill text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">Copiar</button>
        </div>
        <div className="text-[11px] text-amber-700/70 mt-1 h-4">{copied?"Copiado":""}</div>
      </div>
      <div>
        <label className="label">Fecha (opcional)</label>
        <input type="date" value={state.fecha} onChange={e=>setState(s=>({...s,fecha:e.target.value}))} className="w-full input-pill"/>
      </div>
      <div>
        <label className="label">Hora (opcional)</label>
        <input type="time" value={state.hora} onChange={e=>setState(s=>({...s,hora:e.target.value}))} className="w-full input-pill"/>
      </div>
    </div>
  </section>);
}

function CartList({cart,setCart,canCalc}){
  const totalItems=cart.reduce((a,it)=>a+it.qty,0);
  function inc(i){ setCart(cs=>cs.map((it,idx)=>idx===i?{...it,qty:it.qty+1}:it)); }
  function dec(i){ setCart(cs=>cs.map((it,idx)=>idx===i && it.qty>1?{...it,qty:it.qty-1}:it)); }
  function del(i){ setCart(cs=>cs.filter((_,idx)=>idx!==i)); }

  return (<section className="max-w-4xl mx-auto px-3 sm:px-4">
    <h2 className="font-semibold text-amber-900 mb-2">Tu carrito <span className="text-amber-700/70 text-sm">({totalItems} ítem{totalItems!==1?"s":""})</span></h2>
    <div className="grid gap-3">
      {cart.map((it,i)=>(<div key={i} className="glass rounded-2xl p-3 sm:p-4 border border-amber-100/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-amber-900">{it.name}</div>
            <div className="text-amber-700/80 text-sm mt-0.5">{it.description||""}</div>
            <div className="text-[12px] mt-1 space-y-0.5">
              {it.toppings?.length ? <div>· Toppings: {it.toppings.join(", ")}</div> : null}
              {it.siropes?.length ? <div>· Siropes: {it.siropes.map(s=>s.name+(s.extra?` (+${soles(s.extra)})`:"")).join(", ")}</div> : null}
              {it.premium?.length ? <div>· Premium: {it.premium.map(p=>`${p.name} x${p.qty}`).join(", ")}</div> : null}
              {it.recipient || it.notes ? <div>· Dedicatoria: {(it.recipient||"")+(it.recipient&&it.notes?" — ":"")+(it.notes||"")}</div> : null}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-amber-900">{soles(it.unitPrice)}</div>
            <div className="mt-2 inline-flex items-center gap-1">
              <button onClick={()=>dec(i)} className="px-2 py-1 rounded-full bg-amber-100/80 hover:bg-amber-200">-</button>
              <span className="w-8 text-center">{it.qty}</span>
              <button onClick={()=>inc(i)} className="px-2 py-1 rounded-full bg-amber-100/80 hover:bg-amber-200">+</button>
            </div>
            <button onClick={()=>del(i)} className="block mt-3 text-[12px] text-amber-700/80 hover:text-amber-900">Eliminar</button>
          </div>
        </div>
      </div>))}
      {cart.length===0 ? <div className="text-amber-700/70 text-sm">Tu carrito está vacío.</div> : null}
    </div>
  </section>);
}

function PaymentBox({total,canCalc}){
  const [copied,setCopied]=useState(false);
  return (<section className="max-w-4xl mx-auto px-3 sm:px-4 pt-2">
    <div className="glass rounded-2xl border border-amber-100/70 overflow-hidden">
      <div className="p-3 sm:p-4 flex items-center gap-3">
        <img src={QR} className="h-24 w-24 object-cover rounded-xl ring-1 ring-amber-200"/>
        <div className="flex-1">
          <div className="font-semibold text-amber-900">Paga por Yape/Plin</div>
          <div className="text-amber-700/80 text-sm">Número: {YAPE} — Titular: {NOMBRE_TITULAR}</div>
          <button onClick={()=>copyText(YAPE,setCopied)} className="mt-2 btn-pill text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">Copiar número</button>
          <div className="text-[11px] text-amber-700/70 mt-1 h-4">{copied?"Copiado":""}</div>
        </div>
        <div className="text-right pr-3 sm:pr-4">
          <div className="text-sm text-amber-700/80">Delivery: {soles(DELIVERY)}</div>
          <div className="mt-1 text-lg font-semibold text-amber-900">Total: {canCalc?soles(total):"—"}</div>
        </div>
      </div>
    </div>
  </section>);
}

function SeguirComprandoModal({open,setOpen,onSeguir}){
  if(!open) return null;
  return (<div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-3">
    <div className="glass max-w-md w-full rounded-2xl border border-amber-100/70 p-4">
      <h3 className="font-semibold text-amber-900">¿Seguir comprando?</h3>
      <p className="text-sm text-amber-700/80 mt-1">Se guardarán tus datos de entrega temporalmente para que no tengas que escribirlos otra vez.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={()=>setOpen(false)} className="btn-pill bg-white text-amber-900 border border-amber-200 hover:bg-amber-50">Cancelar</button>
        <button onClick={onSeguir} className="btn-pill text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">Sí, seguir</button>
      </div>
    </div>
  </div>);
}

function buildWhatsApp(cart,state,total){
  const L=[];
  if(cart.length===0){ return null; }
  const {nombre,telefono,distrito,direccion,referencia,mapLink,fecha,hora}=state;
  if(!nombre || !telefono || telefono.length!==9 || !distrito || !direccion){ return false; }

  const addressForMaps = [direccion, distrito].filter(Boolean).join(", ");
  const mapsAuto = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addressForMaps);
  const mapsURL = (mapLink && mapLink.trim().length>0) ? mapLink.trim() : mapsAuto;

  const telFmt = `+51 ${telefono.slice(0,3)} ${telefono.slice(3,6)} ${telefono.slice(6)}`;

  L.push("Waffle King — Pedido");
  if(fecha||hora){L.push("");L.push(`Fecha de entrega: ${fecha||"-"}`);L.push(`Hora: ${hora||"-"}`)};L.push("");

  cart.forEach((it,i)=>{L.push(`${i+1}. ${it.name} x${it.qty} — ${soles(it.unitPrice*it.qty)}`);
    if(it.toppings?.length)L.push("   · Toppings: "+it.toppings.join(", "));
    if(it.siropes?.length)L.push("   · Siropes: "+it.siropes.map(s=>s.name+(s.extra?` (+${soles(s.extra)})`:"")).join(", "));
    if(it.premium?.length)L.push("   · Premium: "+it.premium.map(p=>`${p.name} x${p.qty}`).join(", "));
    if(it.recipient || it.notes){ L.push("   · Dedicatoria: "+(it.recipient||"")+(it.recipient&&it.notes?" — ":"")+(it.notes?it.notes:"")); }
  });

  L.push("");L.push(`Cliente: ${nombre}`);L.push(`Tel: ${telFmt}`);
  L.push(`Dirección: ${distrito} — ${direccion}`);
  if(referencia)L.push("Referencia: "+referencia);
  L.push("Google Maps: "+mapsURL);
  L.push("");L.push("Delivery: "+soles(DELIVERY));L.push("Total a pagar: "+soles(total));
  L.push("Forma de pago: Yape/Plin "+YAPE+" — Nombre: "+NOMBRE_TITULAR);
  L.push("ADJUNTAR CAPTURA DE PAGO CON YAPE.");

  return encodeURIComponent(L.join("\n"));
}
/* ===== Registro Google Sheets (parche mínimo, sin tocar tu lógica) ===== */
function buildOrderPayloadForSheets({orderId, cart, state, subtotal, total, whatsAppText}) {
  return {
    orderId,
    cliente: {
      nombre: state?.nombre || '',
      telefono: state?.telefono || '',
      distrito: state?.distrito || '',
      direccion: state?.direccion || '',
      referencia: state?.referencia || '',
      mapLink: state?.mapLink || ''
    },
    programado: {
      fecha: state?.fecha || '',
      hora:  state?.hora  || ''
    },
    montos: {
      subtotal,
      delivery: DELIVERY,
      total
    },
    pago: {
      metodo:  'Yape/Plin',
      numero:  YAPE,
      titular: NOMBRE_TITULAR
    },
    items: (cart || []).map(it => ({
      name: it.name,
      qty: Number(it.qty || 0),
      unitPrice: Number(it.unitPrice || 0),
      toppings: it.toppings || [],
      siropes:  it.siropes  || [],
      premium:  it.premium  || [],
      recipient: it.recipient || '',
      notes: it.notes || ''
    })),
    whatsAppText
  };
}

async function registrarPedidoGSheet(payload) {
  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(SHEETS_WEBAPP_URL, blob);
      if (ok) return true;
    }

    await fetch(SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    return true;
  } catch (_e) {
    return false;
  }
}
/* ===== Fin parche Google Sheets ===== */

function App(){
  const savedDelivery = (() => { try { return JSON.parse(localStorage.getItem('wk_delivery') || '{}'); } catch(e){ return {}; } })();
  const [state,setState]=useState({nombre:savedDelivery.nombre||"",telefono:savedDelivery.telefono||"",distrito:savedDelivery.distrito||"",direccion:savedDelivery.direccion||"",referencia:savedDelivery.referencia||"",mapLink:savedDelivery.mapLink||"",fecha:savedDelivery.fecha||"",hora:savedDelivery.hora||""});

  // Guardado extra por si el usuario cierra pestaña muy rápido
  useEffect(()=>{
    const timer = setInterval(()=>{ try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){} }, 800);
    return ()=>clearInterval(timer);
  },[state]);

  const [cart,setCart]=useState([]);
  const [open,setOpen]=useState(false);
  const [canCalc,setCanCalc]=useState(false);

  useEffect(()=>{
    try{ setCart(JSON.parse(localStorage.getItem("wk_cart")||"[]")); }catch(e){ setCart([]); }
  },[]);

  useEffect(()=>{
    // Si no hay carrito, no mostrar total de inmediato
    setCanCalc(cart.length>0);
  },[cart]);

  function seguirComprando(){
    try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){}
    location.href='index.html';
  }

  const subtotal=cart.reduce((a,it)=>a+it.unitPrice*it.qty,0);
  const total = canCalc && cart.length>0 ? subtotal + DELIVERY : subtotal;

  function enviar(){
    if(cart.length===0){ toast("Agrega al menos un producto"); return; }
    let effective = state;
    try { const saved = JSON.parse(localStorage.getItem('wk_delivery')||'{}'); effective = {...saved, ...state}; } catch(e){}
    const text=buildWhatsApp(cart,effective,total);
    if(text===false){ toast("Completa los datos de entrega"); return; }
    if(text===null){ toast("Carrito vacío"); return; }
    // --- Parche: registrar en Google Sheets sin bloquear la UX ---
    const orderId = 'WK-' + Date.now().toString(36).toUpperCase();
    const payload = buildOrderPayloadForSheets({
      orderId, cart, state: effective, subtotal, total, whatsAppText: decodeURIComponent(text)
    });
    registrarPedidoGSheet(payload);
    // --- Fin parche ---
    window.open(`https://wa.me/${WHA}?text=${text}`,"_blank");
    try{
      localStorage.removeItem("wk_cart");
      localStorage.removeItem("wk_delivery");
      localStorage.setItem("wk_clear_delivery","1");
    }catch(e){}
    setTimeout(()=>{ location.href='index.html'; }, 300);
  }

  return (<div>
    <HeaderMini onSeguir={seguirComprando}/>
    <DatosEntrega state={state} setState={setState}/>
    <CartList cart={cart} setCart={setCart} canCalc={canCalc}/>
    <PaymentBox total={total} canCalc={canCalc}/>
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 pb-16">
      <button onClick={enviar} className="w-full btn-pill text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">
        Enviar pedido por WhatsApp
      </button>
    </section>
    <div id="toast" className="toast">Mensaje</div>
  </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
