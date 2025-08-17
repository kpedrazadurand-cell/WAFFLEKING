const {useState,useEffect}=React;
const LOGO="assets/logo.png";const QR="assets/yape-qr.png";
const YAPE="957285316";const NOMBRE_TITULAR="Kevin R. Pedraza D.";
const WHA="51957285316";const DELIVERY=7;
const soles=n=>"S/ "+(Math.round(n*100)/100).toFixed(2);
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400)}

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
        <div className="leading-4"><h1 className="font-extrabold text-base">Waffle King</h1><p className="text-xs text-slate-700">Confirmación y pago</p></div>
        <div className="ml-auto">
          <button onClick={onSeguir} className="btn-pill border border-amber-300 hover:bg-amber-50 text-amber-800">Seguir comprando</button>
        </div>
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
  return (
    <div>
      <label className="text-sm font-medium">Teléfono</label>
      <input value={val} onChange={handle} inputMode="numeric" placeholder="9xxxxxxxx"
             className="mt-1 w-full rounded-lg border border-slate-300 p-2"/>
      {preview && <div className="text-xs text-slate-500 mt-1">Formato: {preview}</div>}
    </div>
  );
}

const DISTRITOS = ["Comas","Puente Piedra","Los Olivos","Independencia"];

function DatosEntrega({state,setState}){
  const storeKey='wk_delivery';
  const [hydrated,setHydrated]=useState(false);
  // 1) cargar una sola vez (hidratar)
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(storeKey);
      if(raw){
        const data=JSON.parse(raw);
        setState(s=>({...s, ...data}));
      }
    }catch(e){}
    setHydrated(true);
  },[]);
  // 2) guardar SOLO después de hidratar, para no sobrescribir con vacíos
  useEffect(()=>{
    if(!hydrated) return;
    try{ localStorage.setItem(storeKey, JSON.stringify(state)); }catch(e){}
  },[state, hydrated]);

  const {nombre,telefono,distrito,direccion,referencia,mapLink,fecha,hora}=state;
  const set=(k,v)=>setState(s=>({...s,[k]:v}));

  /* ========================= 📍 MI UBICACIÓN (ROBUSTO) =========================
     - Reintenta con menor precisión si hay timeout
     - Mensajes claros para iPhone/Android
     - Reverse geocoding (Nominatim) para dirección legible
     - Persiste como parte de Datos de entrega
  ============================================================================== */

  // Helper: promesa para getCurrentPosition
  function getPos(opts){
    return new Promise((resolve, reject)=>{
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });
  }
  // Intenta alta precisión y reintenta con menor precisión si hay timeout
  async function obtenerPosicionRobusta(){
    try{
      return await getPos({ enableHighAccuracy:true, timeout:8000, maximumAge:0 });
    }catch(e){
      if(e && e.code===3){ // TIMEOUT
        return await getPos({ enableHighAccuracy:false, timeout:8000, maximumAge:60000 });
      }
      throw e;
    }
  }

  const handleUbicacion = async () => {
    if (!('geolocation' in navigator)) {
      toast('Tu navegador no soporta ubicación.');
      return;
    }
    toast('Obteniendo ubicación…');
    try{
      const { coords } = await obtenerPosicionRobusta();
      const lat = coords.latitude, lng = coords.longitude;
      const mapsURL = `https://www.google.com/maps?q=${lat},${lng}`;

      let finalDireccion = `${lat.toFixed(5)}, ${lng.toFixed(5)}`; // fallback
      try{
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
        const res = await fetch(url, { headers: { 'Accept':'application/json' } });
        const data = await res.json();
        if(data){
          if (data.address){
            const a = data.address;
            const linea1 = [a.road, a.house_number].filter(Boolean).join(' ').trim();
            const zona   = (a.neighbourhood || a.suburb || a.city_district || '').trim();
            const ciudad = (a.city || a.town || a.village || a.county || '').trim();
            const region = (a.state || '').trim();
            const cp     = (a.postcode || '').trim();
            const partes = [linea1, zona, ciudad, region, cp].filter(Boolean);
            if (partes.length) finalDireccion = partes.join(', ');
          }
          if (!finalDireccion && data.display_name) finalDireccion = data.display_name;
        }
      }catch(_){ /* dejamos fallback */ }

      set('direccion', finalDireccion);
      set('mapLink', mapsURL);
      toast('Ubicación detectada ✓');
    }catch(err){
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (err && err.code === 1) {
        toast(isIOS
          ? 'Permiso denegado. Ajustes ▸ Privacidad ▸ Localización ▸ Safari: permitir + “Ubicación precisa”.'
          : 'Permiso denegado. Revisa los permisos de ubicación del navegador.');
      } else if (err && err.code === 2) {
        toast('Posición no disponible. Activa GPS o prueba en exterior.');
      } else if (err && err.code === 3) {
        toast('Tiempo de espera agotado. Intenta nuevamente cerca de una ventana.');
      } else {
        toast('Error de ubicación. Intenta de nuevo.');
      }
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-soft">
        <h3 className="font-semibold mb-2">Datos de entrega</h3>
        <div className="space-y-2">
          <div><label className="text-sm font-medium">Nombre</label><input value={nombre||""} onChange={e=>set('nombre',e.target.value)} placeholder="Tu nombre" className="mt-1 w-full rounded-lg border border-slate-300 p-2"/></div>
          <PhoneInput value={telefono||""} onChange={v=>set('telefono',v)}/>
          <div><label className="text-sm font-medium">Distrito</label>
            <select value={distrito||""} onChange={e=>set('distrito',e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2">
              <option value="">Selecciona distrito</option>
              {DISTRITOS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Dirección + botón a la derecha */}
          <div>
            <label className="text-sm font-medium">Dirección</label>
            <div className="mt-1 flex gap-2">
              <input
                id="direccion"
                value={direccion||""}
                onChange={e=>set('direccion',e.target.value)}
                placeholder="Calle 123, Mz Lt"
                className="flex-1 min-w-0 rounded-lg border border-slate-300 p-2"
              />
              <button
                type="button"
                onClick={handleUbicacion}
                className="shrink-0 whitespace-nowrap rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm"
                title="Usar mi ubicación actual"
              >
                📍 Mi ubicación
              </button>
            </div>
          </div>

          <div><label className="text-sm font-medium">Referencia</label><input value={referencia||""} onChange={e=>set('referencia',e.target.value)} placeholder="Frente a parque / tienda / etc." className="mt-1 w-full rounded-lg border border-slate-300 p-2"/></div>
          <div><label className="text-sm font-medium">Link de Google Maps (opcional)</label><input value={mapLink||""} onChange={e=>set('mapLink',e.target.value)} placeholder="Pega tu link" className="mt-1 w-full rounded-lg border border-slate-300 p-2"/></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-sm font-medium">Fecha de entrega</label><input type="date" value={fecha||""} onChange={e=>set('fecha',e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2"/></div>
            <div><label className="text-sm font-medium">Hora</label><input type="time" value={hora||""} onChange={e=>set('hora',e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2"/></div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PACKS=[
 {id:"classic",name:"Waffle Clásico (1 piso)",base:20,incTop:2,incSir:1},
 {id:"special",name:"Waffle Especial (1 piso)",base:25,incTop:3,incSir:2},
 {id:"king",name:"Waffle King (2 pisos)",base:40,incTop:4,incSir:3},
];
const TOPS=[
 {id:"t-platano",name:"Plátano"},{id:"t-fresa",name:"Fresa"},
 {id:"t-obs",name:"Obsesión"},{id:"t-lentejitas",name:"Lentejitas"},
 {id:"t-princesa",name:"Princesa"},{id:"t-oreo",name:"Oreo"},
 {id:"t-morochas",name:"Morochas"},{id:"t-chips",name:"Chips Ahoy"},
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

function EditModal({item, onClose, onSave}){
  const baseItem = JSON.parse(JSON.stringify(item||{}));
  const [packId,setPackId]=useState(baseItem.packId || "classic");
  const pack = PACKS.find(p=>p.id===packId) || PACKS[0];
  const [qty,setQty]=useState(baseItem.qty||1);
  const [tops,setTops]=useState(()=> (baseItem.toppings||[]).map(n=> (TOPS.find(t=>t.name===n)||{}).id).filter(Boolean) );
  const [sirs,setSirs]=useState(()=> (baseItem.siropes||[]).map(s=> (SIROPES.find(x=>x.name===s.name)||{}).id).filter(Boolean) );
  const [prem,setPrem]=useState(()=>{
    const m = Object.fromEntries(PREMIUM.map(p=>[p.id,0]));
    (baseItem.premium||[]).forEach(p=>{ const id=(PREMIUM.find(x=>x.name===p.name)||{}).id; if(id) m[id]=p.qty; });
    return m;
  });
  const [recipient,setRecipient]=useState(baseItem.recipient||"");
  const [notes,setNotes]=useState(baseItem.notes||"");

  function toggle(list,setter,limit,id){
    setter(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : (prev.length<limit?[...prev,id]:prev));
  }
  function setPremium(id,d){ setPrem(prev=>({...prev,[id]:Math.max(0,(+prev[id]||0)+d)})) }

  function save(){
    const base = pack.base;
    const sirsObjs = SIROPES.filter(s=>sirs.includes(s.id)).map(s=>({name:s.name,extra:s.extra||0}));
    const extraSirs = sirsObjs.reduce((a,s)=>a+(s.extra||0),0);
    const premObjs = PREMIUM.filter(p=>(+prem[p.id]||0)>0).map(p=>({name:p.name,price:p.price,qty:+prem[p.id]}));
    const extraPrem = premObjs.reduce((a,p)=>a+p.price*p.qty,0);
    const unit = base + extraSirs + extraPrem;
    const updated = {
      ...baseItem,
      name: pack.name,
      packId: pack.id,
      basePrice: base,
      incTop: pack.incTop,
      incSir: pack.incSir,
      qty: Math.max(1, qty),
      toppings: TOPS.filter(t=>tops.includes(t.id)).map(t=>t.name),
      siropes: sirsObjs,
      premium: premObjs,
      unitPrice: unit,
      recipient, notes
    };
    onSave(updated);
  }

  const limits={incTop:pack.incTop,incSir:pack.incSir};

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Editar pedido</div>
          <button className="btn-pill border" onClick={onClose}>Cerrar</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PACKS.map(p=>(
              <button key={p.id} onClick={()=>{setPackId(p.id);setTops([]);setSirs([]);setPrem(Object.fromEntries(PREMIUM.map(x=>[x.id,0])));}}
                className={"text-left rounded-xl border p-3 "+(p.id===packId?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")}>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-600">Incluye {p.incTop} toppings + {p.incSir} siropes</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cantidad</span>
            <button className="px-2 py-1 rounded-full border" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
            <span className="w-10 text-center">{qty}</span>
            <button className="px-2 py-1 rounded-full border" onClick={()=>setQty(q=>q+1)}>+</button>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Toppings ({(tops||[]).length}/{limits.incTop} incl.)</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {TOPS.map(t=>{const active=tops.includes(t.id);const dis=!active && (tops.length>=limits.incTop);
                return <button key={t.id} onClick={()=>!dis&&toggle(tops,setTops,limits.incTop,t.id)} className={"text-left rounded-xl border px-3 py-2 "+(active?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}>
                  <div className="flex items-center justify-between"><span>{t.name}</span>{active&&<span className="text-xs text-amber-700">✓</span>}</div></button>;
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Siropes ({(sirs||[]).length}/{limits.incSir} incl.)</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SIROPES.map(s=>{const active=sirs.includes(s.id);const dis=!active && (sirs.length>=limits.incSir);
                return <button key={s.id} onClick={()=>!dis&&toggle(sirs,setSirs,limits.incSir,s.id)} className={"text-left rounded-xl border px-3 py-2 "+(active?"border-amber-300 bg-amber-50":"border-slate-200 bg-white")+(dis?" opacity-50 cursor-not-allowed":"")}>
                  <div className="flex items-center justify-between"><span>{s.name}{s.extra?` (+${soles(s.extra)})`:""}</span>{active&&<span className="text-xs text-amber-700">✓</span>}</div></button>;
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Toppings Premium</div>
            <div className="grid md:grid-cols-2 gap-2">
              {PREMIUM.map(p=>(
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-600">+ S/ {p.price.toFixed(2)} c/u</div></div>
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,-1)}>−</button>
                      <span className="w-8 text-center">{prem[p.id]||0}</span>
                      <button className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Dedicatoria (opcional)</div>
            <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Para Mackey..." className="mt-1 w-full rounded-lg border border-slate-300 p-2"/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,180))} className="mt-2 w-full rounded-lg border border-slate-300 p-2" rows="2" placeholder="Mensaje / dedicatoria"></textarea>
            <div className="text-xs text-slate-500">{notes.length}/180</div>
          </div>
        </div>

        <div className="px-5 py-3 border-t bg-white sticky bottom-0 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-pill border">Cancelar</button>
          <button onClick={save} className="btn-pill bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function CartList({cart, setCart, canCalc}){
  
  const [openAll,setOpenAll]=useState(true);
  const [editIdx,setEditIdx]=useState(null);

  useEffect(()=>{
    try{ setCart(JSON.parse(localStorage.getItem("wk_cart")||"[]")); }catch(e){ setCart([]); }
  },[]);

  

  const subtotal=cart.reduce((a,it)=>a+it.unitPrice*it.qty,0);
  const total = canCalc && cart.length>0 ? subtotal + DELIVERY : subtotal;

  function remove(i){ setCart(cart.filter((_,idx)=>idx!==i)); }
  function onSave(updated){ setCart(list=> list.map((it,idx)=> idx===editIdx ? updated : it )); setEditIdx(null); }

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Resumen de tu compra</h3>
          {cart.length>0 && <button className="px-2 py-1 rounded-full border" onClick={()=>setOpenAll(v=>!v)}>
            {openAll?"Ocultar detalle":"Mostrar detalle"}
          </button>}
        </div>

        {cart.length===0 ? <p className="text-sm text-slate-600">Tu carrito está vacío.</p> :
          <ul className="space-y-3">{cart.map((it,i)=>{
            return (
              <li key={i} className="rounded-xl border border-slate-200 p-3 bg-white">
                <div className="sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
                  <div className="flex items-center justify-between sm:block sm:col-span-8">
                    <div className="font-semibold text-sm">{it.name} <span className="text-slate-500">× {it.qty}</span></div>
                    <div className="text-sm sm:hidden">{soles(it.unitPrice)} <span className="text-xs text-slate-500">c/u</span></div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2 text-sm">{soles(it.unitPrice)} <span className="text-xs text-slate-500">c/u</span></div>
                  <div className="mt-2 sm:mt-0 sm:col-span-2 flex items-center justify-end gap-2">
                    <button className="px-2 py-1 rounded-full border" onClick={()=>setEditIdx(i)}>Editar</button>
                    <button className="px-2 py-1 rounded-full border border-red-300 text-red-600" onClick={()=>remove(i)}>Eliminar</button>
                  </div>
                </div>

                {openAll && (<div className="mt-3 text-xs text-slate-700 grid sm:grid-cols-3 gap-3">
                  <div><div className="font-semibold">Toppings</div><div>{(it.toppings&&it.toppings.length)?it.toppings.join(", "):"—"}</div></div>
                  <div><div className="font-semibold">Siropes</div><div>{(it.siropes&&it.siropes.length)?it.siropes.map(s=>s.name+(s.extra?` (+${soles(s.extra)})`:"")).join(", "):"—"}</div></div>
                  <div><div className="font-semibold">Premium</div><div>{(it.premium&&it.premium.length)?it.premium.map(p=>`${p.name} x${p.qty}`).join(", "):"—"}</div></div>
                  <div className="sm:col-span-3"><div className="font-semibold">Dedicatoria</div>
                    <div>{it.recipient ? ("Para: "+it.recipient) : "—"}</div>
                    {it.notes && <div className="mt-0.5">{it.notes}</div>}
                  </div>
                </div>)}
              </li>
            );
          })}</ul>
        }

        <div className="mt-3 text-right text-sm">Subtotal: <b>{soles(subtotal)}</b></div>
        {cart.length>0 && (canCalc
          ? (<>
               <div className="text-right text-sm">Delivery: <b>{soles(DELIVERY)}</b></div>
               <div className="text-right font-bold">Total: {soles(total)}</div>
             </>)
          : (<div className="text-right text-xs text-slate-600">Completa los datos de entrega para calcular el total con delivery.</div>)
        )}
      </div>

      {editIdx!==null && <EditModal item={cart[editIdx]} onClose={()=>setEditIdx(null)} onSave={onSave}/>}
    </section>
  );
}

function PaymentBox({total,canCalc}){
  const [open,setOpen]=useState(false);
  const [copied,setCopied]=useState(false);
  const fmt = YAPE.replace(/(\d{3})(\d{3})(\d{3})/,"$1 $2 $3");
  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 p-4 shadow-soft">
        <h4 className="font-semibold mb-3">Forma de pago</h4>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm leading-6">
            <div><span className="font-medium">Número Yape/Plin:</span> {fmt}</div>
            <div><span className="font-medium">Nombre:</span> {NOMBRE_TITULAR}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>copyText(YAPE,setCopied)} className={"btn-pill border "+(copied?"bg-amber-600 text-white":"border-amber-300 hover:bg-amber-50 text-amber-800")}>
              {copied ? "¡Número copiado!" : "Copiar número"}
            </button>
            <button onClick={()=>setOpen(true)} className="btn-pill border border-amber-300 hover:bg-amber-50 text-amber-800">Ver QR</button>
          </div>
        </div>
        {canCalc && <div className="mt-2 text-sm"><span className="mr-1">Total a pagar</span><span className="font-bold">{soles(total)}</span></div>}
        <div className="text-[12px] text-slate-700 mt-1"><strong>ADJUNTAR CAPTURA DE PAGO CON YAPE</strong></div>

        {open && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setOpen(false)}>
          <div className="bg-white rounded-2xl p-5 w-[340px]" onClick={e=>e.stopPropagation()}>
            <div className="text-center font-semibold mb-3">QR de Yape</div>
            <img src={QR} className="w-full h-auto rounded-xl ring-1 ring-amber-200"/>
            <button onClick={()=>setOpen(false)} className="mt-4 w-full btn-pill bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">Cerrar</button>
          </div>
        </div>)}
      </div>
    </section>
  );
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
    if(it.recipient || it.notes){ L.push("   · Dedicatoria: "+(it.recipient?`Para ${it.recipient}`:"")+(it.recipient&&it.notes?" — ":"")+(it.notes?it.notes:"")); }
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

function App(){
  const savedDelivery = (() => { try { return JSON.parse(localStorage.getItem('wk_delivery') || '{}'); } catch(e){ return {}; } })();
  const [state,setState]=useState({nombre:savedDelivery.nombre||"",telefono:savedDelivery.telefono||"",distrito:savedDelivery.distrito||"",direccion:savedDelivery.direccion||"",referencia:savedDelivery.referencia||"",mapLink:savedDelivery.mapLink||"",fecha:savedDelivery.fecha||"",hora:savedDelivery.hora||""});

  // Guardado extra por si el usuario cierra pestaña muy rápido
  useEffect(()=>{
    const handler=()=>{ try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){} };
    window.addEventListener('beforeunload', handler);
    return ()=>window.removeEventListener('beforeunload', handler);
  },[state]);

  // callback seguro para seguir comprando
  function seguirComprando(){
    try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){}
    location.href='index.html';
  }

  const [cart,setCart]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("wk_cart")||"[]"); }catch(e){ return []; } });
  useEffect(()=>{ try{ localStorage.setItem("wk_cart", JSON.stringify(cart)); }catch(e){} }, [cart]);
  const subtotal=cart.reduce((a,it)=>a+it.unitPrice*it.qty,0);
  const canCalc = !!(state.distrito && state.direccion);
  const total = canCalc && cart.length>0 ? subtotal + DELIVERY : subtotal;

  function enviar(){
    if(cart.length===0){ toast("Agrega al menos un producto"); return; }
    let effective = state;
    try { const saved = JSON.parse(localStorage.getItem('wk_delivery')||'{}'); effective = {...saved, ...state}; } catch(e){}
    const text=buildWhatsApp(cart,effective,total);
    if(text===false){ toast("Completa los datos de entrega"); return; }
    if(text===null){ toast("Carrito vacío"); return; }
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
  </div>);
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);




/* ==== WK Sheets Sync — Hook no intrusivo (pegar al final de checkout.js) ==== */
(function(){
  // ⛳ URL de tu Apps Script (/exec) — versión nueva
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz2sMiMO0dWhoamBNS0D2mFkt-BbbXhqZ7l3uB7af_2xi-SZVJdO5iIklA1U_lWh3Gn1w/exec";

  // Utilidad
  const solesToNum = (s) => {
    if (!s) return 0;
    const n = String(s).replace(/[^\d.,]/g,"").replace(/\./g,"").replace(",",".");
    const v = parseFloat(n);
    return isNaN(v) ? 0 : v;
  };
  const norm = (t) => (t||"").trim();

  // Enviar sin bloquear la apertura de WhatsApp
  function sendPayload(payload){
    try{
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], {type:"application/json"});
        navigator.sendBeacon(SCRIPT_URL, blob);
      } else {
        fetch(SCRIPT_URL, { method:"POST", headers:{ "Content-Type":"application/json" }, body }).catch(()=>{});
      }
    }catch(e){ console.warn("WK sync error", e); }
  }

  // Parser del texto que ya arma tu WhatsApp
  function parseWhatsAppText(txt){
    const lines = txt.split(/\r?\n/).map(l => l.replace(/\u00A0/g," ").trim()).filter(Boolean);
    const payload = {
      version: "1.0",
      fechaPedidoISO: new Date().toISOString(),
      cliente: { nombre:"", telefono:"", distrito:"", direccion:"", referencia:"", mapLink:"" },
      entrega: { fecha:"", hora:"" },
      delivery: 0,
      total: 0,
      items: []
    };

    let currentItem = null;

    const reItem = /^\d+\.\s+(.+?)\s+x(\d+)\s+—/i;
    const reTops = /^·\s*Toppings:\s*(.+)$/i;
    const reSirs = /^·\s*Siropes:\s*(.+)$/i;
    const rePrem = /^·\s*Premium:\s*(.+)$/i;

    lines.forEach((raw) => {
      const line = raw;

      if (/^Fecha de entrega:/i.test(line)){ payload.entrega.fecha = norm(line.split(":")[1]); return; }
      if (/^Hora:/i.test(line)){ payload.entrega.hora = norm(line.split(":")[1]); return; }

      const mItem = line.match(reItem);
      if (mItem){
        const name = norm(mItem[1]);
        const qty  = parseInt(mItem[2],10) || 1;
        currentItem = { waffle: name, qty, toppings: [], siropes: [], premium: [], notes:"", recipient:"" };
        payload.items.push(currentItem);
        return;
      }

      if (currentItem){
        const mT = line.match(reTops);
        if (mT){ currentItem.toppings = mT[1].split(",").map(s => norm(s)); return; }

        const mS = line.match(reSirs);
        if (mS){
          currentItem.siropes = mS[1].split(",").map(s => norm(s.replace(/\(\+?\s*S\/?\s*[\d.,]+\)/gi,"")));
          return;
        }

        const mP = line.match(rePrem);
        if (mP){
          currentItem.premium = mP[1].split(",").map(s=>{
            const mm = s.trim().match(/(.+?)\s*x\s*(\d+)/i);
            if (mm) return { name: norm(mm[1]), qty: parseInt(mm[2],10)||1 };
            return { name: norm(s), qty: 1 };
          });
          return;
        }
      }

      if (/^Cliente:/i.test(line)){ payload.cliente.nombre = norm(line.split(":")[1]); return; }
      if (/^Tel:/i.test(line)){ payload.cliente.telefono = line.replace(/[^\d]/g,"").slice(-9); return; }
      if (/^Dirección:/i.test(line)){
        const rest = norm(line.split(":")[1]);
        const parts = rest.split("—");
        if (parts.length >= 2){
          payload.cliente.distrito = norm(parts[0]);
          payload.cliente.direccion = norm(parts.slice(1).join("—"));
        } else {
          payload.cliente.direccion = rest;
        }
        return;
      }
      if (/^Referencia:/i.test(line)){ payload.cliente.referencia = norm(line.split(":")[1]); return; }
      if (/^Google Maps:/i.test(line)){ payload.cliente.mapLink = norm(line.split(":")[1]); return; }

      if (/^Delivery:/i.test(line)){ payload.delivery = solesToNum(line); return; }
      if (/^Total a pagar:/i.test(line)){ payload.total = solesToNum(line); return; }
    });

    return payload;
  }

  // Hook sin romper nada: intercepta cuando se abre WhatsApp y despacha a Sheets
  const _open = window.open;
  window.open = function(url, target, features){
    try{
      if (typeof url === "string" && url.includes("https://wa.me/") && url.includes("?text=")){
        const q = url.split("?text=")[1] || "";
        const decoded = decodeURIComponent(q.replace(/\+/g," "));
        const payload = parseWhatsAppText(decoded);
        if (payload && payload.items && payload.items.length){
          sendPayload(payload);
        }
      }
    }catch(e){ console.warn("WK hook error", e); }
    return _open.apply(window, arguments);
  };
})();
