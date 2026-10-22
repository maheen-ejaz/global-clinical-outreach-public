// Correspondence is fetched only after sign-in; all mutations are authorised in the database.
window.startOutreach = async function(client, snapshot, email) {
  const $=id=>document.getElementById(id), M=window.OutreachModel;
  const admin=email?.toLowerCase()==='maheenejaz@goocampus.in';
  let rows=[], events=[], current=null, busy=false, dirty=false;
  const providers=[...new Map(snapshot.orgs.filter(o=>o.target?.ready).map(o=>[o.domain,o])).values()];
  const demoMode=new URLSearchParams(location.search).get('demo')==='self';
  const demo={domain:'demo-self.invalid',name:'Maheen Demo Clinical Provider — SELF-TEST',website:'',programs:[],target:{ready:true},emails:[{address:'maheenejaz@goocampus.in',kind:'demo_self',status:'self_confirmed',source_url:location.origin+'/?view=outreach&demo=self'}]};
  if(demoMode)providers.splice(0,providers.length,demo);
  const fields=['recipient','subject','body','timezone','timezone_source'];
  $('outreachAccess').textContent=admin?'You can edit and approve. Gmail scheduling happens during an active Codex session.':'View only. Maheen edits and approves; Gmail scheduling is verified separately.';
  if(snapshot.activity_summary&&!demoMode)$('outreachAccess').textContent+=' Current outreach is tracked in Attio; this screen retains earlier pilot records.';
  if(demoMode){
    $('outreachAccess').textContent='Self-test only: recipient fixed to maheenejaz@goocampus.in. Real providers are hidden. Locking records approval; it does not trigger Gmail.';
    $('oe-calendar-label').textContent='I approve this self-only test at the exact date/time shown, including a weekend if chosen.';
    $('oe-checks-label').textContent='The only recipient is my office inbox. I approve this exact test subject and body. This is not approval for contacting providers.';
  }
  const status=message=>{$('outreachStatus').textContent=message;};
  function node(tag,text,cls='') { const e=document.createElement(tag);e.textContent=text;e.className=cls;return e; }
  const stamp = window.formatTimestamp;
  async function refresh() {
    const [items,history]=await Promise.all([
      M.loadAll(client,'outreach_items','domain',demoMode?demo.domain:null),
      M.loadAll(client,'outreach_events','id',demoMode?demo.domain:null)
    ]);
    rows=items.filter(r=>demoMode?r.domain===demo.domain:r.domain!==demo.domain);
    events=history.filter(e=>demoMode?e.domain===demo.domain:e.domain!==demo.domain).reverse();
    renderList();renderOverview();
    $('outreachFreshness').textContent=`Loaded ${stamp(new Date())}. Gmail is checked only during requested sessions.`;
  }
  function renderOverview() {
    if(demoMode||!$('outreachOverviewFigures'))return;
    const saved=snapshot.activity_summary;
    const c=saved?saved.counts:M.summary(rows,events).counts;
    const figures=$('outreachOverviewFigures');figures.replaceChildren();
    for(const [key,label,hint] of [
      ['sent','Emails sent','Confirmed in Gmail'],['responded','Human replies','One response per outreach email'],
      ['interested','Interested','Positive human replies'],['rejected','Rejected','Negative replies or opt-outs'],
      ['awaiting','Awaiting reply','No human reply recorded yet'],['cold','Gone cold','No human reply after 14 days']
    ]) {
      const figure=node('div','','figure'+(key==='sent'?' key':''));figure.dataset.metric=key;
      figure.append(node('div',new Intl.NumberFormat().format(c[key]),'v'),node('div',label,'l label'),node('div',hint,'h caption'));figures.append(figure);
    }
    $('outreachOverviewExtra').textContent=`${c.scheduled} scheduled · ${c.other} other human replies · ${c.automatic} emails with automatic replies · ${c.delivery} delivery problems`;
    if(saved){
      $('outreachOverviewStatus').textContent=`Gmail/Attio snapshot checked ${stamp(saved.checked_at)} · ${c.total_contacts} tracked contacts · ${c.awaiting_review} awaiting review. Reloading saved activity does not check Gmail. Current correspondence is tracked in Attio.`;
      $('overviewActivityOpen').textContent='Earlier pilot details';
      return;
    }
    const checked=rows.map(r=>r.last_checked_at).filter(Boolean).sort();
    $('outreachOverviewStatus').textContent=`Records loaded ${stamp(new Date())}. Latest recorded Gmail check: ${checked.length?stamp(checked.at(-1)):'none'}. Check times may differ by provider; see Outreach details.`;
  }
  function overviewError(error) {
    if(snapshot.activity_summary&&!demoMode){renderOverview();return;}
    if(!demoMode&&$('outreachOverviewStatus'))$('outreachOverviewStatus').textContent=`Activity could not be loaded: ${error.message}. Any displayed counts are from the previous successful load.`;
  }
  function renderList() {
    const q=$('outreachSearch').value.toLowerCase(), filter=$('outreachFilter').value;
    const active=rows.filter(r=>r.state!=='parked');
    $('outreachCounts').textContent=`${providers.length} shortlisted providers · ${M.preparationCount(rows)}/5 preparing · ${active.length} selected total · ${rows.filter(r=>r.state==='locked').length} awaiting Gmail · ${rows.filter(r=>r.state==='scheduled').length} scheduled · ${rows.filter(r=>r.state==='sent').length} confirmed sent`;
    if(demoMode)$('outreachCounts').textContent=`Self-test provider · ${rows[0]?M.labels[rows[0].state]:'Not selected'} · Does not use a pilot slot`;
    const known=new Map(providers.map(p=>[p.domain,p]));
    for(const r of rows) if(!known.has(r.domain)) known.set(r.domain,{domain:r.domain,name:r.domain,emails:[],programs:[],target:{ready:false}});
    const body=$('outreachTable').querySelector('tbody');body.replaceChildren();
    for(const p of known.values()) {
      const r=rows.find(r=>r.domain===p.domain), state=r?.state||'shortlisted';
      if(filter && (filter==='selected'? !r||state==='parked' : state!==filter))continue;
      if(!`${p.name} ${p.domain} ${r?.draft.recipient||''} ${r?.draft.subject||''}`.toLowerCase().includes(q))continue;
      const tr=node('tr','');
      for(const text of [p.name,r?.draft.recipient||`${p.emails.filter(M.eligible).length} eligible addresses`,M.labels[state]||'Shortlisted',r?.draft.subject||'—',stamp(r?.send_at)])tr.append(node('td',text));
      const td=node('td',''), button=node('button',r?'Open':'Select','btn');button.disabled=busy||(!admin&&!r);
      button.onclick=()=>{if(dirty&&!confirm('Discard unsaved edits?'))return;open(p,r);};td.append(button);tr.append(td);body.append(tr);
    }
    if(!body.children.length){const td=node('td','No providers match.');td.colSpan=6;const tr=node('tr','');tr.append(td);body.append(tr);}
  }
  function open(p,r) {
    current={provider:p,row:r};dirty=false;$('outreachEditor').hidden=false;
    $('outreachProvider').textContent=p.name;$('outreachState').textContent=M.labels[r?.state]||'Not yet selected';
    const select=$('oe-recipient');select.replaceChildren();
    for(const e of p.emails.filter(M.eligible)){const o=node('option',`${e.address}${e.person?' — '+e.person:''}`);o.value=e.address;select.append(o);}
    if(r?.draft.recipient&&!Array.from(select.options).some(o=>o.value===r.draft.recipient)){const o=node('option',r.draft.recipient+' — recheck eligibility');o.value=r.draft.recipient;select.append(o);}
    for(const f of fields)$('oe-'+f).value=r?.draft[f]|| (f==='recipient'?select.options[0]?.value||'':'');
    const editable=admin&&(!r||['draft','finalised','cancelled','parked','locked'].includes(r.state));
    for(const f of fields)$('oe-'+f).disabled=!editable;
    if(demoMode)select.disabled=true;
    $('oe-save').hidden=!editable;$('oe-finalise').hidden=!admin||r?.state!=='draft';
    $('oe-park').hidden=!admin||!r||!['draft','finalised'].includes(r.state);
    $('oe-unlock').hidden=!admin||r?.state!=='locked';
    $('outreachTime').hidden=r?.state!=='finalised'&&r?.state!=='locked'&&r?.state!=='scheduled';
    $('oe-time').disabled=!admin||r?.state!=='finalised';
    $('oe-time').value=r?.send_at&&r.draft.timezone?M.localValue(r.send_at,r.draft.timezone):'';
    $('oe-calendar').checked=false;$('oe-checks').checked=false;
    $('oe-lock').hidden=!admin||r?.state!=='finalised';$('oe-suggest').hidden=!admin||r?.state!=='finalised';
    $('oe-confirmations').hidden=!admin||r?.state!=='finalised';
    $('outreachReview').textContent=r?.review?`${demoMode?'Self-test review':'Review'}: ${r.review.score}/100; all ten mandatory rules passed. Editing invalidates this review.`:'No passing review recorded. Codex must review the exact draft before it can be locked.';
    $('outreachProof').textContent=`Gmail reference: ${r?.gmail_reference||'none'} · Last checked: ${stamp(r?.last_checked_at)} · Last saved: ${stamp(r?.updated_at)}`;
    $('outreachSource').replaceChildren();
    for(const url of [...new Set([p.website,...p.programs.map(x=>x.source_url),...p.emails.filter(M.eligible).map(x=>x.source_url)])].filter(Boolean)){
      try {const u=new URL(url);if(!['https:','http:'].includes(u.protocol))continue;const a=node('a',u.hostname+u.pathname);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';$('outreachSource').append(a,node('br',''));}catch{}
    }
    const history=$('outreachHistory');history.replaceChildren();
    for(const e of events.filter(e=>e.domain===p.domain)){
      const li=node('li',`${stamp(e.recorded_at)} · ${e.action.replaceAll('_',' ')} · version ${e.version}`);
      const detail=node('details','');detail.append(node('summary','View saved version and evidence'));const pre=node('pre',JSON.stringify({draft:e.snapshot.draft,send_at:e.snapshot.send_at,evidence:e.evidence},null,2));detail.append(pre);li.append(detail);history.append(li);
    }
    showLocal();$('outreachEditor').scrollIntoView({behavior:'auto',block:'start'});
  }
  function draft(){return Object.fromEntries(fields.map(f=>[f,$('oe-'+f).value.trim()]));}
  async function mutate(action,data) {
    if(busy||!current)return;busy=true;status('Saving…');
    document.querySelectorAll('#panel-outreach button').forEach(b=>b.disabled=true);
    try {
      const {error}=await client.rpc('outreach_edit',{p_domain:current.provider.domain,p_version:current.row?.version||0,p_action:action,p_data:data});
      if(error)throw Error(error.message);
      const p=current.provider;dirty=false;await refresh();open(p,rows.find(r=>r.domain===p.domain));status('Saved.');
    }catch(e){status(`${e.message}. Your editor is preserved; refresh if another session changed this row.`);}
    finally{busy=false;document.querySelectorAll('#panel-outreach button').forEach(b=>b.disabled=false);renderList();}
  }
  function proposal(){return demoMode?new Date(Math.ceil((Date.now()+10*60000)/60000)*60000).toISOString():M.suggest(current.row.draft.timezone,occupied());}
  if(demoMode)$('oe-suggest').textContent='Suggest ten minutes from now';
  function occupied(){return rows.filter(r=>r.domain!==current.provider.domain&&['finalised','locked','scheduling','scheduled'].includes(r.state)).map(r=>r.send_at);}
  function showLocal(){try{const zone=current?.row?.draft.timezone;if(!$('oe-time').value||!zone){$('outreachLocalTime').textContent='';return;}const t=M.localInstant($('oe-time').value,zone);$('outreachLocalTime').textContent=`Recipient: ${stamp(t,zone)} · IST: ${stamp(t)}`;}catch(e){$('outreachLocalTime').textContent=e.message;}}
  $('oe-save').onclick=()=>mutate('save',draft());
  $('oe-finalise').onclick=()=>{try{if(dirty)throw Error('Save your edits before finalising');const t=proposal();mutate('finalise',{send_at:t});}catch(e){status(e.message);}};
  $('oe-suggest').onclick=()=>{try{$('oe-time').value=M.localValue(proposal(),current.row.draft.timezone);showLocal();}catch(e){status(e.message);}};
  $('oe-lock').onclick=()=>{try{if(dirty)throw Error('Save and finalise the changed draft before locking');mutate('lock',{send_at:M.localInstant($('oe-time').value,current.row.draft.timezone),calendar_checked:$('oe-calendar').checked,sending_checks_passed:$('oe-checks').checked});}catch(e){status(e.message);}};
  $('oe-unlock').onclick=()=>mutate('unlock',{});$('oe-park').onclick=()=>mutate('park',{});
  $('oe-time').oninput=showLocal;
  for(const f of fields)$('oe-'+f).oninput=()=>{dirty=true;status('Unsaved changes. Save to invalidate any previous finalisation or approval.');};
  $('outreachSearch').oninput=renderList;$('outreachFilter').onchange=renderList;
  const refreshActivity=async()=>{if(dirty&&!confirm('Discard unsaved edits?'))return;try{await refresh();if(current)open(current.provider,rows.find(r=>r.domain===current.provider.domain));status('Refreshed.');}catch(e){status(e.message);overviewError(e);}};
  $('outreachRefresh').onclick=refreshActivity;
  if($('overviewActivityRefresh'))$('overviewActivityRefresh').onclick=snapshot.activity_summary&&!demoMode?()=>location.reload():refreshActivity;
  if($('overviewActivityOpen'))$('overviewActivityOpen').onclick=()=>$('tab-outreach').click();
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  if(snapshot.activity_summary&&!demoMode)renderOverview();
  try{await refresh();}catch(e){status(`Outreach is not available: ${e.message}`);overviewError(e);}
};
