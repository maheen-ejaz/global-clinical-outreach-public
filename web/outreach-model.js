// Pure scheduling helpers shared by the private UI and deterministic tests.
(function (root) {
  const labels = {draft:'Draft',finalised:'Finalised—choose time',locked:'Locked—awaiting Gmail',scheduling:'Scheduling—verification pending',scheduled:'Scheduled',sent:'Sent',cancelled:'Cancelled',send_failed:'Delivery problem',suppressed:'Do not contact',parked:'Not selected'};
  const eligible = e => e.kind !== 'pattern_guess' && e.status !== 'invalid' && Boolean(e.source_url);
  function parts(instant, zone) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
  }
  function localValue(instant, zone) {
    const p=parts(instant,zone); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  function localInstant(value, zone) {
    // Reject DST gaps/ambiguities rather than silently change an approved wall-clock time.
    const target=Date.parse(`${value}:00Z`); if (!Number.isFinite(target)) throw Error('Enter a valid date and time');
    const matches=[];
    for(let offset=-14*60;offset<=14*60;offset+=15) {
      const t=target+offset*60000; if(localValue(t,zone)===value) matches.push(t);
    }
    if(matches.length!==1) throw Error('This local time is missing or ambiguous because of a clock change. Choose another time.');
    return new Date(matches[0]).toISOString();
  }
  function suggest(zone, occupied=[], now=Date.now()) {
    const first=Math.ceil((now+15*60000)/600000)*600000;
    for(let t=first;t<first+14*86400000;t+=600000) {
      const p=parts(t,zone);
      if(!['Sat','Sun'].includes(p.weekday) && +p.hour>=9 && +p.hour<11 && occupied.every(x=>Math.abs(Date.parse(x)-t)>=600000)) return new Date(t).toISOString();
    }
    throw Error('No available morning slot in the next two weeks; choose a time manually.');
  }
  function preparationCount(rows) {
    return rows.filter(r=>r.domain!=='demo-self.invalid' && ['draft','finalised','locked','scheduling'].includes(r.state)).length;
  }
  // One outreach email per provider in the current store. History retains sent proof
  // even when a later opt-out changes the current row to suppressed.
  function summary(rows, events, now=Date.now()) {
    const real=rows.filter(r=>r.domain!=='demo-self.invalid');
    const history=new Map();
    for(const e of events) {
      if(e.domain==='demo-self.invalid')continue;
      if(!history.has(e.domain))history.set(e.domain,[]);
      history.get(e.domain).push(e);
    }
    const counts={sent:0,responded:0,interested:0,rejected:0,other:0,awaiting:0,cold:0,automatic:0,delivery:0,scheduled:0};
    const details=[];
    for(const r of real) {
      const log=(history.get(r.domain)||[]).sort((a,b)=>b.version-a.version);
      const sent=log.find(e=>e.action==='sent');
      if(r.state==='scheduled')counts.scheduled++;
      if(!sent && r.state!=='sent') {
        if(r.state==='send_failed')counts.delivery++;
        continue;
      }
      counts.sent++;
      const replies=log.filter(e=>e.action==='reply' && (!sent||e.version>sent.version));
      const human=replies.find(e=>['positive','negative','neutral','redirect','unclear','opt_out'].includes(e.evidence?.outcome));
      const latestDelivery=replies.find(e=>e.evidence?.outcome==='bounce');
      let outcome;
      if(human) {
        counts.responded++;
        outcome=human.evidence.outcome==='positive'?'interested':['negative','opt_out'].includes(human.evidence.outcome)?'rejected':'other';
      } else if(latestDelivery)outcome='delivery';
      else {
        // Conservative clock: start when Sent was confirmed, not a scheduled time.
        const confirmedAt=Date.parse(sent?.recorded_at);
        outcome=Number.isFinite(confirmedAt)&&now-confirmedAt>=14*86400000?'cold':'awaiting';
      }
      counts[outcome]++;
      if(replies.some(e=>e.evidence?.outcome==='automatic'))counts.automatic++;
      details.push({domain:r.domain,outcome,confirmed_at:sent?.recorded_at||null,last_checked_at:r.last_checked_at});
    }
    return {counts,details};
  }
  async function loadAll(client, table, order, domain=null) {
    const result=[], size=500;
    for(let offset=0;;offset+=size) {
      let query=client.from(table).select('*');
      if(domain)query=query.eq('domain',domain);
      const {data,error}=await query.order(order,{ascending:true}).range(offset,offset+size-1);
      if(error)throw Error(error.message);
      result.push(...data);
      if(data.length<size)return result;
    }
  }
  root.OutreachModel={labels,eligible,parts,localValue,localInstant,suggest,preparationCount,summary,loadAll};
})(globalThis);
