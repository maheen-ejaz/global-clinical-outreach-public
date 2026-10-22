import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/outreach-model.js';
const M=globalThis.OutreachModel;
test('suggestions use recipient business mornings, future slots and ten-minute spacing',()=>{
  const now=Date.parse('2026-10-09T22:00:00Z'); // Friday evening in New York.
  const first=M.suggest('America/New_York',[],now);
  assert.equal(first,'2026-10-12T13:00:00.000Z');
  assert.equal(M.suggest('America/New_York',[first],now),'2026-10-12T13:10:00.000Z');
  const india=M.suggest('Asia/Kolkata',[],now);
  assert.equal(M.parts(india,'Asia/Kolkata').hour,'09');
  assert.ok(Date.parse(india)>now);
});
test('wall-clock conversion respects half-hour offsets and rejects DST gaps and overlaps',()=>{
  assert.equal(M.localInstant('2026-10-12T09:00','Asia/Kolkata'),'2026-10-12T03:30:00.000Z');
  assert.equal(M.localInstant('2026-11-02T09:00','America/New_York'),'2026-11-02T14:00:00.000Z');
  assert.throws(()=>M.localInstant('2026-03-08T02:30','America/New_York'),/ambiguous/);
  assert.throws(()=>M.localInstant('2026-11-01T01:30','America/New_York'),/ambiguous/);
  assert.throws(()=>M.suggest('Made/Up'),/time zone/);
});
test('guessed, invalid and unsourced addresses do not appear in the editor',()=>{
  assert.equal(M.eligible({kind:'pattern_guess',status:'valid',source_url:'https://hospital.test'}),false);
  assert.equal(M.eligible({kind:'published',status:'invalid',source_url:'https://hospital.test'}),false);
  assert.equal(M.eligible({kind:'published',status:'unknown'}),false);
  assert.equal(M.eligible({kind:'generic_inbox',status:'unknown',source_url:'https://hospital.test'}),true);
});

test('outreach summary counts confirmed sends, latest human outcomes and exact cold boundary',()=>{
  const now=Date.parse('2026-10-20T12:00:00Z');
  const rows=['positive','negative','neutral','recent','cold','auto','bounce','optout','scheduled','demo-self.invalid'].map(domain=>({domain,state:domain==='scheduled'?'scheduled':domain==='optout'?'suppressed':'sent'}));
  const event=(domain,version,action,outcome,recorded_at='2026-10-06T12:00:00Z')=>({domain,version,action,recorded_at,evidence:{outcome}});
  const events=rows.filter(r=>r.state!=='scheduled').map(r=>event(r.domain,1,'sent',null,r.domain==='recent'?'2026-10-06T12:00:00.001Z':undefined));
  events.push(event('positive',2,'reply','negative'),event('positive',3,'reply','positive'),event('positive',4,'reply','automatic'),event('negative',2,'reply','negative'),event('neutral',2,'reply','redirect'),event('auto',2,'reply','automatic'),event('bounce',2,'reply','bounce'),event('optout',2,'reply','opt_out'));
  const result=M.summary(rows,events.reverse(),now);
  assert.deepEqual(result.counts,{sent:8,responded:4,interested:1,rejected:2,other:1,awaiting:1,cold:2,automatic:2,delivery:1,scheduled:1});
  assert.equal(result.details.find(x=>x.domain==='cold').outcome,'cold');
  assert.equal(result.details.find(x=>x.domain==='recent').outcome,'awaiting');
});
test('scheduled, drafts and failed sends never become sent just because their time passed',()=>{
  assert.equal(M.summary([{domain:'one',state:'scheduled',send_at:'2000-01-01'},{domain:'two',state:'draft'},{domain:'three',state:'send_failed'}],[]).counts.sent,0);
  assert.equal(M.summary([{domain:'one',state:'sent'}],[]).counts.awaiting,1);
});
test('all activity pages are loaded and pagination failures are surfaced',async()=>{
  const requests=[];
  const client={from(table){return {select(){return this},order(field){assert.equal(field,'id');return this},range(a,b){requests.push([table,a,b]);return Promise.resolve({data:Array.from({length:a===0?500:2},(_,i)=>({id:a+i})),error:null});}}}};
  assert.equal((await M.loadAll(client,'outreach_events','id')).length,502);
  assert.deepEqual(requests,[['outreach_events',0,499],['outreach_events',500,999]]);
  await assert.rejects(()=>M.loadAll({from(){return {select(){return this},order(){return this},range(){return {error:{message:'Unavailable'}};}}}},'outreach_events','id'),/Unavailable/);
});

test('preparation quota excludes preserved schedules, terminal history and self-demo',()=>{
  const states=['draft','finalised','locked','scheduling','scheduled','sent','cancelled','send_failed','suppressed','parked'];
  const rows=states.map((state,i)=>({domain:`h${i}.test`,state}));
  assert.equal(M.preparationCount([...rows,{domain:'demo-self.invalid',state:'draft'}]),4);
});
