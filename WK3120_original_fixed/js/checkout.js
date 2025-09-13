/* global React, ReactDOM */
const {useState,useEffect,useRef} = React;

// ======= CHECKOUT COMPLETO =======
const LOGO="assets/logo.png";
const QR="assets/yape-qr.png";
const YAPE="942504978";
const NOMBRE_TITULAR="Sheila M. Sánchez T.";
const WHA="51942504978";
const DELIVERY=5;

/* ===================== CLOUDINARY (unsigned) ===================== */
const CLOUDINARY_CLOUD = "dw35nct1h";
const CLOUDINARY_PRESET = "wk-payments";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`;

/* ============ WebApp de Google Sheets ============== */
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxIOX0o4KclXe8RqXagiyWLPEFtnzFPV0xF4-nRuOntNT5XdUgDEn2Iws805QRix-LJwQ/exec';

const soles = n => "S/ " + (Math.round(n*100)/100).toFixed(2);
function toast(m){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent=m; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1400);
}

async function copyText(text,setCopied){
  try{ await navigator.clipboard.writeText(text); setCopied(true); }
  catch(e){
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); setCopied(true);}catch(_){}
    document.body.removeChild(ta);
  }
  setTimeout(()=>setCopied(false),1600);
}

/* ======== Envío a Google Sheets (sendBeacon + fallback) ======== */
async function registrarPedidoGSheet(payload) {
  try {
    const url = SHEETS_WEBAPP_URL + '?t=' + Date.now();
    const data = JSON.stringify(payload);

    // 1) Intento con sendBeacon (ideal porque no bloquea navegación)
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, data); // Apps Script acepta JSON crudo en postData.contents
      if (ok) return true;
    }
    // 2) Fallback: x-www-form-urlencoded (payload=...)
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'payload=' + encodeURIComponent(data)
    });
    return true;
  } catch (e) {
    console.error('[WK] registrarPedidoGSheet error:', e);
    return false;
  }
}

/* ===== Compresión de imagen (para acelerar el upload del voucher) ===== */
async function compressImage(file, maxW=1600, maxH=1600, quality=0.75){
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  await new Promise(res => { img.onload = res; img.src = url; });
  let { naturalWidth: w, naturalHeight: h } = img;
  let nw = w, nh = h;
  if (w > maxW || h > maxH){
    const r = Math.min(maxW/w, maxH/h);
    nw = Math.round(w*r); nh = Math.round(h*r);
  }
  const canvas = document.createElement('canvas');
  canvas.width = nw; canvas.height = nh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, nw, nh);
  return new Promise(res=>{
    canvas.toBlob(b=>{
      const compressed = new File([b], file.name.replace(/\.\w+$/, '.jpg'), { type:'image/jpeg' });
      URL.revokeObjectURL(url);
      res(compressed);
    }, 'image/jpeg', quality);
  });
}

function HeaderMini({onSeguir}){
  return (
    <header className="sticky top-0 z-40 glass border-b border-amber-100/70">
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Waffle King" className="h-9 w-9 rounded-xl ring-1 ring-amber-200 object-contain" />
          <div className="leading-4">
            <h1 className="font-extrabold text-base">Waffle King</h1>
            <p className="text-xs text-slate-700">Confirmación y pago</p>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={onSeguir}
              className="btn-pill border"
              style={{ background:'var(--wk-cream)', borderColor:'var(--wk-gold)', color:'#111' }}
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===== Validador de entrega ===== */
function validateDelivery(s){
  const errs = {};
  if(!s.nombre?.trim()) errs.nombre = "Ingresa tu nombre";
  if(!/^\d{9}$/.test((s.telefono||"").trim())) errs.telefono = "Número de 9 dígitos";
  if(!s.distrito?.trim()) errs.distrito = "Selecciona distrito";
  if(!s.direccion?.trim()) errs.direccion = "Ingresa dirección";
  if(!s.fecha?.trim()) errs.fecha = "Selecciona fecha";
  if(!s.hora?.trim()) errs.hora = "Selecciona hora";
  return errs;
}

function PhoneInput({value,onChange,error}){
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
      <input
        value={val}
        onChange={handle}
        inputMode="numeric"
        placeholder="9xxxxxxxx"
        aria-invalid={!!error}
        className={
          "mt-1 w-full rounded-lg border p-2 " +
          (error ? "border-[var(--wk-title-red)]" : "border-slate-300")
        }
      />
      {preview && <div className="text-xs text-slate-500 mt-1">Formato: {preview}</div>}
    </div>
  );
}

const DISTRITOS = ["Comas","Puente Piedra","Los Olivos","Independencia", "San Martin de Porres", "Carabyllo"];

/* ========= Fechas de fines de semana + bloques horarios ========= */
const TIME_SLOTS = ["8:00–10:00 am","2:00–4:00 pm"];
const MONTHS_ABR = ["ene","feb","mar","abr","may","jun","jul","ago","set","oct","nov","dic"];
const WEEKDAYS_ABR = ["dom","lun","mar","mié","jue","vie","sáb"];

function getUpcomingWeekendOptions(nWeekends=8){
  const out = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  let d = new Date(today);
  while (d.getDay() !== 6 && d.getDay() !== 0) d.setDate(d.getDate()+1);
  while (out.length < nWeekends*2){
    if ((d.getDay()===6 || d.getDay()===0) && d >= today){
      const label = `${cap(WEEKDAYS_ABR[d.getDay()])} ${d.getDate()} ${MONTHS_ABR[d.getMonth()]}`;
      out.push({
        dateISO: d.toISOString().slice(0,10),
        label,
        fullLabel: d.toLocaleDateString("es-PE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
      });
    }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (d.getDay()===6 ? 1 : 6));
  }
  return out;
}
function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* ========= UI: Datos de entrega (sin “Mi ubicación” ni “Link de Google Maps”) ========= */
function DatosEntrega({state,setState, errors={}}){
  const storeKey='wk_delivery';
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(storeKey);
      if(raw){ const data=JSON.parse(raw); setState(s=>({...s, ...data})); }
    }catch(e){}
    setHydrated(true);
  },[]);
  useEffect(()=>{
    if(!hydrated) return;
    try{ localStorage.setItem(storeKey, JSON.stringify(state)); }catch(e){}
  },[state, hydrated]);

  const {nombre,telefono,distrito,direccion,referencia,fecha,hora}=state;
  const set=(k,v)=>setState(s=>({...s,[k]:v}));

  const weekendOptionsRef = useRef(getUpcomingWeekendOptions(8));
  const weekendOptions = weekendOptionsRef.current;

  const selectedLabel = React.useMemo(()=>{
    const opt = weekendOptions.find(o=>o.dateISO===fecha);
    return opt ? opt.label : "";
  }, [fecha, weekendOptions]);

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-soft">
        <h3 className="font-bold text-[var(--wk-title-red)] mb-2">Datos de entrega</h3>
        <div className="space-y-2">
          {/* Nombre */}
          <div id="field-nombre">
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={nombre||""}
              onChange={e=>set('nombre',e.target.value)}
              placeholder="Tu nombre"
              aria-invalid={!!errors.nombre}
              className={"mt-1 w-full rounded-lg border p-2 " + (errors.nombre ? "border-[var(--wk-title-red)]" : "border-slate-300")}
            />
            {errors.nombre && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.nombre}</div>}
          </div>

          {/* Teléfono */}
          <div id="field-telefono">
            <PhoneInput value={telefono||""} onChange={v=>set('telefono',v)} error={errors.telefono}/>
            {errors.telefono && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.telefono}</div>}
          </div>

          {/* Dirección */}
          <div id="field-direccion">
            <label className="text-sm font-medium">Dirección</label>
            <div className="mt-1">
              <input
                value={direccion||""}
                onChange={e=>set('direccion',e.target.value)}
                placeholder="Calle 123, Mz Lt"
                aria-invalid={!!errors.direccion}
                className={"w-full rounded-lg border p-2 " + (errors.direccion ? "border-[var(--wk-title-red)]" : "border-slate-300")}
              />
            </div>
            {errors.direccion && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.direccion}</div>}
          </div>

          {/* Distrito */}
          <div id="field-distrito">
            <label className="text-sm font-medium">Distrito</label>
            <select
              value={distrito||""}
              onChange={e=>set('distrito',e.target.value)}
              aria-invalid={!!errors.distrito}
              className={"mt-1 w-full rounded-lg border p-2 " + (errors.distrito ? "border-[var(--wk-title-red)]" : "border-slate-300")}
            >
              <option value="">Selecciona distrito</option>
              {DISTRITOS.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.distrito && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.distrito}</div>}
          </div>

          {/* Referencia (opcional) */}
          <div>
            <label className="text-sm font-medium">Referencia</label>
            <input
              value={referencia||""}
              onChange={e=>set('referencia',e.target.value)}
              placeholder="Frente a parque / tienda / etc."
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          {/* Fecha + Horario */}
          <div className="grid grid-cols-2 gap-2">
            <div id="field-fecha">
              <label className="text-sm font-medium">Fecha de entrega</label>
              <select
                value={fecha||""}
                onChange={e=>set('fecha', e.target.value)}
                aria-invalid={!!errors.fecha}
                className={"mt-1 w-full rounded-lg border p-2 " + (errors.fecha ? "border-[var(--wk-title-red)]" : "border-slate-300")}
                title={selectedLabel ? `(${selectedLabel})` : "Elige sábado o domingo"}
              >
                <option value="" disabled>Elige sábado o domingo…</option>
                {weekendOptions.map(opt=>(
                  <option key={opt.dateISO} value={opt.dateISO} title={opt.fullLabel}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.fecha && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.fecha}</div>}
            </div>

            <div id="field-hora">
              <label className="text-sm font-medium">Horario de entrega</label>
              <select
                value={hora||""}
                onChange={e=>set('hora', e.target.value)}
                aria-invalid={!!errors.hora}
                className={"mt-1 w-full rounded-lg border p-2 " + (errors.hora ? "border-[var(--wk-title-red)]" : "border-slate-300")}
              >
                <option value="" disabled>Elige intervalo…</option>
                {TIME_SLOTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.hora && <div className="text-xs text-[var(--wk-title-red)] mt-1">{errors.hora}</div>}
            </div>
          </div>

          {(fecha && hora) && (
            <div className="text-xs mt-1 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 inline-block">
              Entrega: <b>{selectedLabel}</b> · <b>{hora}</b>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ====== PACKS del editor ====== */
const PACKS=[
  {id:"special",name:"Waffle Especial (1 piso)",base:25,incTop:3,incSir:2},
  {id:"king",   name:"Waffle King (2 pisos)",  base:45,incTop:4,incSir:3},
];

/* ====== MASAS ====== */
const MASAS = [
  { id:"clasica",  name:"Clásica (harina de trigo)", delta:0 },
  { id:"fitness",  name:"Premium (avena)",            delta:5 },
];

/* ====== LISTAS ====== */
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

function EditModal({item, onClose, onSave}){
  const baseItem = JSON.parse(JSON.stringify(item||{}));

  const initialPackId = (PACKS.some(p=>p.id===baseItem.packId) ? baseItem.packId : PACKS[0].id);
  const [packId,setPackId]=useState(initialPackId);
  const pack = PACKS.find(p=>p.id===packId) || PACKS[0];

  const [masaId, setMasaId] = useState(baseItem.masaId || "clasica");

  const [qty,setQty]=useState(baseItem.qty||1);
  const [tops,setTops]=useState(()=> (baseItem.toppings||[])
    .map(n=> (TOPS.find(t=>t.name===n)||{}).id).filter(Boolean) );
  const [sirs,setSirs]=useState(()=> (baseItem.siropes||[])
    .map(s=> (SIROPES.find(x=>x.name===s.name)||{}).id).filter(Boolean) );
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

    const masaDelta = (MASAS.find(m => m.id === masaId)?.delta || 0);
    const masaName  = (MASAS.find(m => m.id === masaId)?.name  || "Clásica (harina de trigo)");

    const unit = base + extraSirs + extraPrem + masaDelta;

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
      masaId, masaName, masaDelta,
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
          <button type="button" className="btn-pill border" onClick={onClose}>Cerrar</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* PACKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PACKS.map(p=>(
              <button
                key={p.id}
                type="button"
                onClick={()=>{
                  setPackId(p.id);
                  setTops([]); setSirs([]); setPrem(Object.fromEntries(PREMIUM.map(x=>[x.id,0])));
                  setMasaId("clasica");
                }}
                className={
                  "text-left rounded-xl border p-3 " +
                  (p.id===packId ? "border-2 border-[var(--wk-gold)] bg-white" : "border-slate-200 bg-white")
                }>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-600">Incluye {p.incTop} toppings + {p.incSir} siropes</div>
              </button>
            ))}
          </div>

          {/* MASA */}
          <div>
            <div className="text-sm font-medium mb-1">Tipo de masa</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {MASAS.map(m => {
                const active = masaId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={()=> setMasaId(m.id)}
                    className={
                      "text-left rounded-xl border px-3 py-2 " +
                      (active ? "border-2 border-[var(--wk-gold)] bg-white" : "border-slate-200 bg-white")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span>{m.name}</span>
                      {m.delta > 0 && <span className="text-xs">+{soles(m.delta)}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CANTIDAD */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cantidad</span>
            <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
            <span className="w-10 text-center">{qty}</span>
            <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setQty(q=>q+1)}>+</button>
          </div>

          {/* TOPPINGS */}
          <div>
            <div className="text-sm font-medium mb-1">Toppings ({(tops||[]).length}/{limits.incTop} incl.)</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {TOPS.map(t=>{
                const active=tops.includes(t.id); const dis=!active && (tops.length>=limits.incTop);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={()=>!dis&&toggle(tops,setTops,limits.incTop,t.id)}
                    className={
                      "text-left rounded-xl border px-3 py-2 " +
                      (active ? "border-2 border-[var(--wk-gold)] bg-white" : "border-slate-200 bg-white") +
                      (dis ? " opacity-50 cursor-not-allowed" : "")
                    }>
                    <div className="flex items-center justify-between">
                      <span>{t.name}</span>{active&&<span className="text-xs text-[var(--wk-brown-deep)]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIROPES */}
          <div>
            <div className="text-sm font-medium mb-1">Siropes ({(sirs||[]).length}/{limits.incSir} incl.)</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SIROPES.map(s=>{
                const active=sirs.includes(s.id); const dis=!active && (sirs.length>=limits.incSir);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={()=>!dis&&toggle(sirs,setSirs,limits.incSir,s.id)}
                    className={
                      "text-left rounded-xl border px-3 py-2 " +
                      (active ? "border-2 border-[var(--wk-gold)] bg-white" : "border-slate-200 bg-white") +
                      (dis ? " opacity-50 cursor-not-allowed" : "")
                    }>
                    <div className="flex items-center justify-between">
                      <span>{s.name}{s.extra?` (+${soles(s.extra)})`:""}</span>{active&&<span className="text-xs text-[var(--wk-brown-deep)]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREMIUM */}
          <div>
            <div className="text-sm font-medium">Toppings Premium</div>
            <div className="grid md:grid-cols-2 gap-2">
              {PREMIUM.map(p=>(
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-600">+ S/ {p.price.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,1)}>+</button>
                      <span className="w-8 text-center">{prem[p.id]||0}</span>
                      <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setPremium(p.id,-1)}>−</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEDICATORIA */}
          <div>
            <div className="text-sm font-medium">Dedicatoria (opcional)</div>
            <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Para Mackey..." className="mt-1 w-full rounded-lg border border-slate-300 p-2"/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,180))} className="mt-2 w-full rounded-lg border border-slate-300 p-2" rows="2" placeholder="Mensaje / dedicatoria"></textarea>
            <div className="text-xs text-slate-500">{notes.length}/180</div>
          </div>
        </div>

        <div className="px-5 py-3 border-t bg-white sticky bottom-0 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pill border">Cancelar</button>
          <button type="button" onClick={save} className="btn-pill bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function CartList({cart, setCart, canCalc}){
  const [openAll,setOpenAll]=useState(true);
  const [editIdx,setEditIdx]=useState(null);

  const subtotal=cart.reduce((a,it)=>a+it.unitPrice*it.qty,0);
  const total = canCalc && cart.length>0 ? subtotal + DELIVERY : subtotal;

  function remove(i){ setCart(cart.filter((_,idx)=>idx!==i)); }
  function onSave(updated){ setCart(list=> list.map((it,idx)=> idx===editIdx ? updated : it )); setEditIdx(null); }

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[var(--wk-title-red)]">Resumen de tu compra</h3>
          {cart.length>0 && <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setOpenAll(v=>!v)}>
            {openAll?"Ocultar detalle":"Mostrar detalle"}
          </button>}
        </div>

        {cart.length===0 ? <p className="text-sm text-slate-600">Tu carrito está vacío.</p> :
          <ul className="space-y-3">{cart.map((it,i)=>(
            <li key={i} className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
                <div className="flex items-center justify-between sm:block sm:col-span-8">
                  <div className="font-semibold text-sm">{it.name} <span className="text-slate-500">× {it.qty}</span></div>
                  <div className="text-sm sm:hidden">{soles(it.unitPrice)} <span className="text-xs text-slate-500">c/u</span></div>
                </div>
                <div className="hidden sm:block sm:col-span-2 text-sm">{soles(it.unitPrice)} <span className="text-xs text-slate-500">c/u</span></div>
                <div className="mt-2 sm:mt-0 sm:col-span-2 flex items-center justify-end gap-2">
                  <button type="button" className="px-2 py-1 rounded-full border" onClick={()=>setEditIdx(i)}>Editar</button>
                  <button type="button" className="px-2 py-1 rounded-full border border-red-300 text-red-600" onClick={()=>remove(i)}>Eliminar</button>
                </div>
              </div>

              {openAll && (
                <div className="mt-3 text-xs text-slate-700 grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <div className="font-semibold">Masa</div>
                    <div>{
                      (() => {
                        const fallback = "Clásica (harina de trigo)";
                        if (it.masaName) return it.masaName;
                        if (it.masaId) return (MASAS.find(m => m.id === it.masaId)?.name || fallback);
                        return fallback;
                      })()
                    }</div>
                  </div>

                  <div><div className="font-semibold">Toppings</div><div>{(it.toppings&&it.toppings.length)?it.toppings.join(", "):"—"}</div></div>
                  <div><div className="font-semibold">Siropes</div><div>{(it.siropes&&it.siropes.length)?it.siropes.map(s=>s.name+(s.extra?` (+${soles(s.extra)})`:"")).join(", "):"—"}</div></div>
                  <div><div className="font-semibold">Premium</div><div>{(it.premium&&it.premium.length)?it.premium.map(p=>`${p.name} x${p.qty}`).join(", "):"—"}</div></div>
                  <div className="sm:col-span-3">
                    <div className="font-semibold">Dedicatoria</div>
                    <div>{it.recipient ? ("Para: "+it.recipient) : "—"}</div>
                    {it.notes && <div className="mt-0.5">{it.notes}</div>}
                  </div>
                </div>
              )}
            </li>
          ))}</ul>
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

/* ================= PAYMENT BOX ================= */
function PaymentBox({total,canCalc, onVoucherSelect, onVoucherClear, voucherPreview, voucherErr}){
  const [open,setOpen]=useState(false);
  const [copied,setCopied]=useState(false);
  const [error,setError]=useState("");
  const fileRef=useRef(null);

  const fmt = YAPE.replace(/(\d{3})(\d{3})(\d{3})/,"$1 $2 $3");

  function validarArchivo(f){
    if(!f) return "Selecciona una imagen.";
    if(!f.type.startsWith("image/")) return "El archivo debe ser una imagen.";
    if(f.size > 10*1024*1024) return "Máximo 10MB.";
    return "";
  }

  function abrirPicker(){ fileRef.current?.click(); }

  function limpiarVoucher(){
    onVoucherClear?.();
    setError("");
    if (fileRef.current) fileRef.current.value="";
  }

  async function handleChange(e){
    const f=e.target.files?.[0];
    if(!f) return;
    const msg=validarArchivo(f);
    if(msg){ setError(msg); e.target.value=""; return; }
    setError("");
    try{
      const objURL=URL.createObjectURL(f);
      await onVoucherSelect?.(f, objURL);
    }catch(_){}
  }

  const Logos = (
    <div className="payment-logos flex items-center gap-2">
      <img
        src="assets/yape.png"
        alt="Yape"
        className="h-8 w-8 rounded-md ring-2 ring-white object-cover"
        onError={(e)=>{
          if (!e.target.dataset.retry) { e.target.dataset.retry="1"; e.target.src="../assets/yape.png"; }
          else if (e.target.dataset.retry==="1") { e.target.dataset.retry="2"; e.target.src="assets/yape.jpg"; }
          else if (e.target.dataset.retry==="2") { e.target.dataset.retry="3"; e.target.src="../assets/yape.jpg"; }
          else { e.target.style.display="none"; }
        }}
      />
      <img
        src="assets/plin.png"
        alt="Plin"
        className="h-8 w-8 rounded-md ring-2 ring-white object-cover"
        onError={(e)=>{
          if (!e.target.dataset.retry) { e.target.dataset.retry="1"; e.target.src="assets/plin.jpg"; }
          else if (e.target.dataset.retry==="1") { e.target.dataset.retry="2"; e.target.src="../assets/plin.png"; }
          else if (e.target.dataset.retry==="2") { e.target.dataset.retry="3"; e.target.src="../assets/plin.jpg"; }
          else { e.target.style.display="none"; }
        }}
      />
    </div>
  );

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
      <div className="rounded-2xl border border-amber-200/70 bg-white/90 shadow-[0_6px_18px_rgba(0,0,0,0.06)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {Logos}
            <h4 className="font-bold text-[var(--wk-title-red)]">Forma de pago</h4>
          </div>

          <div className="payment-actions flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={()=>copyText(YAPE,setCopied)}
              className={"w-full sm:w-auto px-3 py-2 rounded-full border text-sm transition "+(copied?"bg-amber-600 text-white border-amber-600":"border-amber-300 text-amber-800 hover:bg-amber-50")}
            >
              {copied ? "¡Número copiado!" : "Copiar número"}
            </button>
            <button
              type="button"
              onClick={()=>setOpen(true)}
              className="w-full sm:w-auto px-3 py-2 rounded-full border border-amber-300 text-amber-800 text-sm hover:bg-amber-50 transition"
            >
              Ver QR
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm leading-6 text-slate-700">
          <div><span className="font-medium">Número Yape/Plin:</span> {fmt}</div>
          <div><span className="font-medium">Nombre:</span> {NOMBRE_TITULAR}</div>
          {canCalc && <div className="mt-1"><span className="mr-1">Total a pagar</span><span className="font-bold">{soles(total)}</span></div>}
        </div>

        <div className="mt-3" id="voucher-area">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden"/>

          {!voucherPreview ? (
            <button
              type="button"
              onClick={abrirPicker}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-white transition active:scale-[0.98]"
              style={{ backgroundImage:'linear-gradient(180deg,#b32b11,#6c1e00)', boxShadow:'0 8px 18px rgba(58,17,4,.22)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l4 4h-3v4h-2V9H8l4-4z"/><path d="M20 18v2H4v-2h16z"/></svg>
              Subir voucher
            </button>
          ) : (
            <div className="flex items-start gap-3">
              <a href={voucherPreview} target="_blank" rel="noreferrer"
                 className="block overflow-hidden rounded-xl ring-1 ring-amber-200 bg-white">
                <img src={voucherPreview} alt="voucher" className="h-24 w-24 object-cover"/>
              </a>
              <div className="flex flex-col gap-2">
                <div className="text-xs text-amber-900">Voucher seleccionado</div>
                <div className="flex gap-2">
                  <button type="button" onClick={abrirPicker} className="px-3 py-1.5 rounded-full border border-amber-300 text-amber-800 text-xs hover:bg-amber-50">Cambiar imagen</button>
                  <button type="button" onClick={limpiarVoucher} className="px-3 py-1.5 rounded-full border border-red-300 text-red-600 text-xs hover:bg-red-50">Quitar</button>
                </div>
                <span className="text-xs text-slate-600">La imagen se subirá al enviar el pedido.</span>
              </div>
            </div>
          )}

          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
          {voucherErr && <div className="text-xs text-[var(--wk-title-red)] mt-2">{voucherErr}</div>}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          role="dialog" aria-modal="true" aria-labelledby="wk-qr-title"
          onClick={()=>setOpen(false)}
        >
          <div className="bg-white rounded-2xl p-5 w-[340px]" onClick={e=>e.stopPropagation()}>
            <div id="wk-qr-title" className="text-center font-semibold mb-3">QR de Yape</div>
            <img src={QR} alt="Código QR de Yape" className="w-full h-auto rounded-xl ring-1 ring-amber-200"/>
            <button type="button" onClick={()=>setOpen(false)} className="mt-4 w-full btn-pill bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">Cerrar</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ===================== WhatsApp message builder ===================== */
function buildWhatsApp(cart,state,total, voucherUrl=""){
  const L=[];
  if(cart.length===0){ return null; }
  const {nombre,telefono,distrito,direccion,referencia,fecha,hora}=state;
  if(!nombre || !telefono || telefono.length!==9 || !distrito || !direccion){ return false; }

  const addressForMaps = [direccion, distrito].filter(Boolean).join(", ");
  const mapsURL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addressForMaps);

  const telFmt = `+51 ${telefono.slice(0,3)} ${telefono.slice(3,6)} ${telefono.slice(6)}`;

  L.push("Waffle King — Pedido");
  if(fecha||hora){L.push("");L.push(`Fecha de entrega: ${fecha||"-"}`);L.push(`Hora: ${hora||"-"}`)};L.push("");

  cart.forEach((it,i)=>{
    L.push(`${i+1}. ${it.name} x${it.qty} — ${soles(it.unitPrice*it.qty)}`);

    const masa = it.masaName || (it.masaId ? (MASAS.find(m=>m.id===it.masaId)?.name||"") : "Clásica (harina de trigo)");
    if(masa) L.push("   · Masa: " + masa);

    if(it.toppings?.length)L.push("   · Toppings: "+it.toppings.join(", "));
    if(it.siropes?.length)L.push("   · Siropes: "+it.siropes.map(s=>s.name+(s.extra?` (+${soles(s.extra)})`:"")).join(", "));
    if(it.premium?.length)L.push("   · Premium: "+it.premium.map(p=>`${p.name} x${p.qty}`).join(", "));
    if(it.recipient || it.notes){
      L.push("   · Dedicatoria: "+(it.recipient?`Para ${it.recipient}`:"")+(it.recipient&&it.notes?" — ":"")+(it.notes?it.notes:""));
    }
  });

  L.push(""); L.push(`Cliente: ${nombre}`); L.push(`Tel: ${telFmt}`);
  L.push(`Dirección: ${distrito} — ${direccion}`);
  if(referencia) L.push("Referencia: "+referencia);
  L.push("Google Maps: "+mapsURL);

  const waffleSubtotal = cart.reduce((a,it)=>a + (it.unitPrice||0)*(it.qty||0), 0);
  L.push("");
  L.push("Datos de pago:");
  L.push(`Waffle: ${soles(waffleSubtotal)}`);
  L.push(`Delivery: ${soles(DELIVERY)}`);
  L.push(`Total a pagar: ${soles(total)}`);
  L.push(`Captura de pago: ${voucherUrl?.trim()?voucherUrl.trim():"(no adjuntado)"}`);
  L.push("");
  L.push("*EN BREVE CONFIRMAREMOS TU PEDIDO*");
  L.push("_Atte: Waffle King_");

  return encodeURIComponent(L.join("\n"));
}

/* ==================== Helpers a Sheets ==================== */
function buildOrderPayloadForSheets({orderId, cart, state, subtotal, total, whatsAppText, voucherUrl = ""}) {
  return {
    orderId,
    cliente: {
      dni:        state?.dni || 0,
      nombre:     state?.nombre || '',
      telefono:   state?.telefono || '',
      distrito:   state?.distrito || '',
      direccion:  state?.direccion || '',
      referencia: state?.referencia || ''
      // (mapLink eliminado)
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
      titular: NOMBRE_TITULAR, 
      link:    voucherUrl || ''
    },
    items: (cart || []).map(it => ({
      name:       it.name,
      qty:        Number(it.qty || 0),
      unitPrice:  Number(it.unitPrice || 0),
      masa:       it.masa || it.masaName || '',
      toppings:   it.toppings || [],
      siropes:    it.siropes  || [],
      premium:    it.premium  || [],
      recipient:  it.recipient || '',
      notes:      it.notes || ''
    })),
    pagoLink: voucherUrl || '',
    whatsAppText
  };
}

/* ================== APP (con validación guiada) ================== */
function App(){
  const savedDelivery = (() => { try { return JSON.parse(localStorage.getItem('wk_delivery') || '{}'); } catch(e){ return {}; } })();
  const [state,setState]=useState({
    nombre:savedDelivery.nombre||"",telefono:savedDelivery.telefono||"",distrito:savedDelivery.distrito||"",
    direccion:savedDelivery.direccion||"",referencia:savedDelivery.referencia||"",
    fecha:savedDelivery.fecha||"",hora:savedDelivery.hora||""
  });

  const [errors, setErrors] = useState({});
  const [voucherErr, setVoucherErr] = useState("");

  function safeParse(json){ try{ return JSON.parse(json); }catch(_){ return null; } }
  function normalizeCart(x){ return Array.isArray(x)?x:[]; }
  function multiRead(){
    const candidates = [
      localStorage.getItem("wk_cart"),
      localStorage.getItem("wk_cart_bkp"),
      sessionStorage.getItem("wk_cart"),
      localStorage.getItem("cart"),
      localStorage.getItem("carrito"),
      localStorage.getItem("shopping_cart"),
    ].map(safeParse).filter(Boolean);

    if (location.hash && location.hash.length>1){
      try{
        const hash = decodeURIComponent(atob(location.hash.slice(1)));
        const parsed = JSON.parse(hash);
        if (Array.isArray(parsed)) candidates.unshift(parsed);
      }catch(_){}
    }
    for(const c of candidates){ if (Array.isArray(c) && c.length) return c; }
    for(const c of candidates){ if (Array.isArray(c)) return c; }
    return [];
  }

  const [cart,setCart]=useState(()=> normalizeCart(multiRead()));

  useEffect(()=>{
    if (cart && cart.length>0) return;
    let tries=0;
    const timer = setInterval(()=>{
      tries++;
      const c = normalizeCart(multiRead());
      if (c.length>0){
        setCart(c);
        clearInterval(timer);
      }
      if (tries>=10){
        clearInterval(timer);
        if (location.protocol==='file:'){
          toast('Abre con http:// (no file://) para compartir el carrito');
        }
      }
    },300);
    return ()=>clearInterval(timer);
  },[]);

  useEffect(()=>{
    try{
      const json = JSON.stringify(cart||[]);
      localStorage.setItem("wk_cart", json);
      localStorage.setItem("wk_cart_bkp", json);
      sessionStorage.setItem("wk_cart", json);
    }catch(_){}
  },[cart]);

  // Voucher
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState("");

  useEffect(()=>{
    const handler=()=>{ try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){} };
    window.addEventListener('beforeunload', handler);
    return ()=>window.removeEventListener('beforeunload', handler);
  },[state]);

  function seguirComprando(){
    try{ localStorage.setItem('wk_delivery', JSON.stringify(state)); }catch(e){}
    location.href='index.html';
  }

  const subtotal=cart.reduce((a,it)=>a+it.unitPrice*it.qty,0);
  const canCalc = !!(state.distrito && state.direccion);
  const total = canCalc && cart.length>0 ? subtotal + DELIVERY : subtotal;

  async function onVoucherSelect(file, previewUrl){
    const THRESHOLD = 1.2 * 1024 * 1024;
    let toUpload = file;
    try{
      if (file && file.size > THRESHOLD) {
        toUpload = await compressImage(file, 1600, 1600, 0.75);
      }
    }catch(_){}
    setVoucherFile(toUpload);
    setVoucherPreview(previewUrl || "");
    setVoucherErr("");
  }
  function onVoucherClear(){ setVoucherFile(null); setVoucherPreview(""); }

  async function subirVoucherAhora(file){
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_PRESET);
    fd.append("folder", "wk3120/payments");
    fd.append("context", `app=wk3120|tipo=voucher|monto=S/${total}`);
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method:"POST", body: fd });
    const data = await res.json();
    if(!data?.secure_url) throw new Error("No se pudo subir el voucher");
    return data.secure_url;
  }

  async function enviar(){
    if(cart.length===0){ toast("Agrega al menos un producto"); return; }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const preWin = !isMobile ? window.open('', '_blank') : null;

    let voucherUrl = "";
    try{
      voucherUrl = await subirVoucherAhora(voucherFile);
    }catch(e){
      toast("Error al subir el voucher. Intenta de nuevo.");
      if (preWin && !preWin.closed) preWin.close();
      return;
    }

    let effective = state;
    try { const saved = JSON.parse(localStorage.getItem('wk_delivery')||'{}'); effective = {...saved, ...state}; } catch(e){}
    const text=buildWhatsApp(cart,effective,total,voucherUrl);
    if(text===false){ toast("Completa los datos de entrega"); if (preWin && !preWin.closed) preWin.close(); return; }
    if(text===null){ toast("Carrito vacío"); if (preWin && !preWin.closed) preWin.close(); return; }

    const waWeb = `https://api.whatsapp.com/send?phone=${WHA}&text=${text}`;

    try {
      const orderId = 'WK-' + Date.now().toString(36).toUpperCase();
      const payload = buildOrderPayloadForSheets({
        orderId,
        cart,
        state: effective,
        subtotal,
        total,
        whatsAppText: decodeURIComponent(text),
        voucherUrl
      });
      console.log('[WK] Enviando a Sheets', { url: SHEETS_WEBAPP_URL, payload });
      const ok = await registrarPedidoGSheet(payload);
      console.log('[WK] registrarPedidoGSheet =>', ok);
      if (ok) toast('Pedido enviado a la hoja ✔');
      else toast('No se pudo enviar a la hoja');
    } catch (_e) {
      console.error('[WK] Error preparando envío a Sheets:', _e);
    }

    if (isMobile) {
      window.location.href = waWeb;
    } else {
      if (preWin && !preWin.closed) { preWin.location.href = waWeb; }
      else { window.open(waWeb, "_blank"); }
    }

    try{
      localStorage.removeItem("wk_cart");
      localStorage.removeItem("wk_delivery");
      localStorage.setItem("wk_clear_delivery","1");
      sessionStorage.removeItem("wk_cart");
    }catch(e){}

    setVoucherFile(null);
    setVoucherPreview("");

    setTimeout(()=>{ location.href='index.html'; }, 2000);
  }

  const [sending, setSending] = useState(false);

  async function handleEnviarClick(){
    const errs = validateDelivery(state);
    const vErr = voucherFile ? "" : "Falta adjuntar voucher de pago";

    setErrors(errs);
    setVoucherErr(vErr);

    if (Object.keys(errs).length || vErr){
      const order = ["nombre","telefono","direccion","distrito","fecha","hora"];
      const first = order.find(k => errs[k]);
      if(first){
        const el = document.getElementById("field-"+first);
        if(el){
          el.scrollIntoView({behavior:"smooth", block:"center"});
          const input = el.querySelector("input,select,textarea");
          input?.focus?.();
        }
      }else{
        document.getElementById("voucher-area")?.scrollIntoView({behavior:"smooth", block:"center"});
      }
      toast("Completar datos de entrega y subir voucher de pago");
      return;
    }
    try{
      setSending(true);
      await enviar();
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <HeaderMini onSeguir={seguirComprando}/>
      <DatosEntrega state={state} setState={setState} errors={errors}/>
      <CartList cart={cart} setCart={setCart} canCalc={canCalc}/>
      <PaymentBox
        total={total}
        canCalc={canCalc}
        onVoucherSelect={onVoucherSelect}
        onVoucherClear={onVoucherClear}
        voucherPreview={voucherPreview}
        voucherErr={voucherErr}
      />
      <section className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 pb-16">
        <button
          type="button"
          onClick={handleEnviarClick}
          disabled={sending}
          className="w-full btn-pill font-bold text-white bg-gradient-to-r from-[#b32b11] to-[#6c1e00] hover:from-[#9f240f] hover:to-[#5a1700] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75"></path>
              </svg>
              Redirigiendo…
            </span>
          ) : "Enviar pedido por WhatsApp"}
        </button>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

