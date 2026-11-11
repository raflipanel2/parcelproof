'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const menu = $('menu-toggle');
  if (menu) menu.addEventListener('click', () => {
    const nav = $('main-nav');
    const expanded = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(expanded));
    menu.textContent = expanded ? '✕ Close' : '☰ Menu';
  });
  if ($('guide-search')) {
    const cards = [...document.querySelectorAll('.guide-card')];
    const buttons = [...document.querySelectorAll('[data-filter]')];
    let cat = 'All';
    const filter = () => {
      const q = $('guide-search').value.trim().toLowerCase();
      let count = 0;
      cards.forEach(card => {
        const visible = (cat === 'All' || card.dataset.category === cat) && (card.dataset.search || '').includes(q);
        card.style.display = visible ? '' : 'none';
        if (visible) count++;
      });
      $('guide-count').textContent = count + (count === 1 ? ' guide' : ' guides');
      $('guide-empty').hidden = count > 0;
    };
    $('guide-search').addEventListener('input', filter);
    buttons.forEach(b => b.addEventListener('click', () => {
      cat = b.dataset.filter;
      buttons.forEach(x => {const selected = x === b; x.classList.toggle('active', selected); x.setAttribute('aria-pressed', String(selected));});
      filter();
    }));
  }
  const val = id => Number($(id).value);
  const fmt = (n,d=2) => Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
  const positive = values => values.every(v => Number.isFinite(v) && v > 0);
  const size = a => a.map(x=>fmt(x,1)).join(' × ') + ' cm';
  const orientations = ([a,b,c]) => [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
  if ($('fit-run')) {
    $('fit-run').addEventListener('click', () => {
      const item = [val('itemL'),val('itemW'),val('itemH')];
      const box = [val('boxL'),val('boxW'),val('boxH')];
      const cushion = val('cushion');
      const out = $('fit-result');
      if (!positive([...item,...box]) || !Number.isFinite(cushion) || cushion < 0) {
        out.className='result error';out.innerHTML='<strong>Invalid input.</strong><p>Item and box measurements must be positive. Cushioning must be zero or more.</p>';return;
      }
      const requirements = orientations(item).map(a=>a.map(x=>x+2*cushion));
      const fitting = requirements.find(r=>r.every((x,i)=>x <= box[i]+1e-8));
      if (fitting) {
        const spare = fitting.map((x,i)=>box[i]-x);
        out.className='result';
        out.innerHTML=`<strong>PASS — a rectangular orientation fits.</strong><p>Protected item: <b>${size(fitting)}</b>; box interior: <b>${size(box)}</b>.</p><p>Unused clearance across the axes: <b>${size(spare)}</b>. Keep the protective pack centered rather than leaving all clearance on one side.</p><p>This does not certify shock protection, box strength or the safety of rotating orientation-sensitive goods.</p>`;
      } else {
        out.className='result error';
        out.innerHTML=`<strong>Does not fit with that cushion allowance.</strong><p>Smallest protected item dimensions before choosing an orientation: <b>${size(item.map(x=>x+2*cushion).sort((a,b)=>b-a))}</b> (sorted).</p><p>Your box interior is <b>${size(box)}</b>. Try a larger suitable box or a different protective system; do not crush the item to make the arithmetic pass.</p>`;
      }
    });
    $('fit-run').click();
  }
  if ($('dim-run')) {
    $('dim-run').addEventListener('click', () => {
      const dims=[val('dimL'),val('dimW'),val('dimH')], actual=val('actual'), divisor=val('divisor'), step=val('roundstep'), out=$('dim-result');
      if (!positive([...dims,divisor]) || !Number.isFinite(actual) || actual<0) {
        out.className='result error';out.innerHTML='<strong>Invalid input.</strong><p>Exterior measurements and divisor must be positive; actual weight cannot be negative.</p>';return;
      }
      const volume=dims.reduce((p,v)=>p*v,1), raw=volume/divisor;
      const round = n => step>0 ? Math.ceil((n-1e-9)/step)*step : n;
      const d=round(raw), a=round(actual), comparison=Math.max(d,a);
      const basis=d>a?'dimensional':a>d?'actual':'equal';
      out.className='result';
      out.innerHTML=`<strong>Comparison weight: ${fmt(comparison)} kg</strong><p>Exterior volume: <b>${fmt(volume,1)} cm³</b>. Raw dimensional: <b>${fmt(raw,3)} kg</b>.</p><p>With selected rounding: DIM <b>${fmt(d)} kg</b>, actual <b>${fmt(a)} kg</b>. The greater figure is <b>${basis} weight</b>.</p><p>Not a shipping rate. Verify divisor, units, rounding, thresholds, minimums and extra fees with the carrier.</p>`;
    });
    $('dim-run').click();
  }
  if ($('check-kind')) {
    const common=['Check that the carrier service accepts the contents.','Inspect the carton or mailer for tears, crush or moisture.','Confirm item and cushioning fit without bulging.','Prevent items from striking outer walls or one another.','Use suitable carton tape and secure all closure seams.','Measure and weigh the fully closed outer parcel.','Remove old labels, addresses and barcodes.','Attach the correct label flat with the barcode readable.','Retain a dispatch receipt or accepted scan.'];
    const extra={standard:['Separate loose sharp accessories.','Support corners and exposed edges.'],fragile:['Inspect rims, handles and thin projections.','Protect fragile pieces individually.','Use adequate buffer on six faces.','Consider appropriate specialist or double-box packaging.'],electronics:['Check current battery eligibility and required marking.','Power off equipment.','Keep chargers and hard accessories off delicate screens.','Handle personal-data removal where needed.'],soft:['Ensure textiles are clean and dry.','Separate zippers, buckles and other sharp hardware.','Do not overcompress structured items.'],liquid:['Check the exact liquid is allowed for the route.','Lock caps and dispenser pumps.','Use compatible secondary leak containment and absorbent layers.','Separate containers to prevent punctures.']};
    let steps=[];
    const key=()=> 'parcelproof-check-v1-'+$('check-kind').value;
    const msg=s=>$('check-status').textContent=s;
    const progress=()=>{
      const done=steps.filter(x=>x.done).length;
      $('check-count').textContent=done+' / '+steps.length+' complete';
      $('check-progress').style.width=(steps.length?100*done/steps.length:0)+'%';
    };
    const render=()=>{
      const list=$('check-list');list.replaceChildren();
      steps.forEach((step,i)=>{
        const label=document.createElement('label');label.className='checkrow';
        const cb=document.createElement('input');cb.type='checkbox';cb.checked=step.done;cb.setAttribute('aria-label','Complete: '+step.text);
        cb.addEventListener('change',()=>{steps[i].done=cb.checked;progress();});
        const span=document.createElement('span');span.textContent=step.text;
        label.append(cb,span);list.append(label);
      });progress();
    };
    const init=()=>{
      steps=[...common,...extra[$('check-kind').value]].map(text=>({text,done:false}));
      try {
        const saved=JSON.parse(localStorage.getItem(key()));
        if(Array.isArray(saved)&&saved.length&&saved.every(s=>typeof s.text==='string'&&typeof s.done==='boolean')){
          steps=saved.slice(0,60).map(s=>({text:s.text.slice(0,160),done:s.done}));msg('Restored saved steps on this device.');
        } else msg('Steps are ready. Choose Save locally to keep your progress.');
      } catch {msg('Browser storage is unavailable; export TXT to keep your work.');}
      render();
    };
    $('check-kind').addEventListener('change',init);
    $('check-add').addEventListener('click',()=>{
      const t=$('check-note').value.trim();if(!t){msg('Write a custom step first.');return;}
      if(steps.length>=60){msg('60-step limit reached.');return;}
      steps.push({text:t.slice(0,140),done:false});$('check-note').value='';render();msg('Added step; save locally when ready.');
    });
    $('check-save').addEventListener('click',()=>{
      try {localStorage.setItem(key(),JSON.stringify(steps));msg('Saved only in this browser. Nothing uploaded.');}
      catch {msg('Local storage is unavailable. Try TXT export.');}
    });
    $('check-reset').addEventListener('click',()=>{try{localStorage.removeItem(key());}catch{}init();msg('Reset this parcel-type checklist.');});
    $('check-export').addEventListener('click',()=>{
      const content=['PARCELPROOF PACKING CHECKLIST','Type: '+$('check-kind').selectedOptions[0].text,'',...steps.map(s=>(s.done?'[x] ':'[ ] ')+s.text),'','Educational checklist; verify service rules.'].join('\n');
      const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='parcelproof-checklist.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);msg('TXT exported locally.');
    });
    $('check-print').addEventListener('click',()=>window.print());
    init();
  }
})();
