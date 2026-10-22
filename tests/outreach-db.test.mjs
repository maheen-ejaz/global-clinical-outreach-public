import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
const admin='00000000-0000-0000-0000-000000000001',viewer='00000000-0000-0000-0000-000000000002', outsider='00000000-0000-0000-0000-000000000003';
test('real PostgreSQL validates roles, versions, pilot limits and Gmail transitions',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb->>'role' $$;
      grant usage on schema auth to authenticated,service_role;
      grant execute on function auth.uid(),auth.role() to authenticated,service_role;
      insert into auth.users values ('${admin}','maheenejaz@goocampus.in',now()),('${viewer}','ashwini.s@goocampus.in',now()),('${outsider}','other@test.invalid',now());`);
    await db.exec(await readFile(new URL('../supabase/migrations/20261009070000_dashboard_access.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261010040527_outreach_workspace.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261010121632_outreach_self_demo.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261012104500_outreach_preparation_slots.sql',import.meta.url),'utf8'));
    await db.exec("insert into dashboard_viewers(email) values ('maheenejaz@goocampus.in'),('ashwini.s@goocampus.in')");
    const orgs=Array.from({length:7},(_,i)=>({domain:`h${i}.test`,name:`Hospital ${i}`,target:{ready:true},emails:[{address:`office@h${i}.test`,kind:'generic_inbox',status:'unknown',source_url:`https://h${i}.test/contact`}]}));
    await db.query('insert into dashboards values ($1,$2,$3,now())',['all','All',{orgs}]);
    const session=(role,uid,fn)=>db.transaction(async tx=>{
      await tx.exec(`set local role ${role}`);await tx.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,role})]);return fn(tx);
    });
    const change=(action,version,data={},domain='h0.test',role='authenticated',uid=admin)=>session(role,uid,async tx=>{
      const fn=role==='service_role'?'outreach_record':'outreach_edit';
      const result=await tx.query(`select to_jsonb(public.${fn}($1,$2,$3,$4)) as r`,[domain,version,action,data]);return result.rows[0].r;
    });
    const draft=i=>({recipient:`office@h${i}.test`,subject:'Clinical partnership proposal',body:'Fixture email for review only.',timezone:'America/New_York',timezone_source:'https://hospital.test/location — New York'});
    await assert.rejects(()=>change('save',0,draft(0),'h0.test','authenticated',viewer),/Only Maheen/);
    let row=await change('save',0,draft(0));assert.equal(row.state,'draft');
    await assert.rejects(()=>change('save',0,draft(0)),/changed/);
    await assert.rejects(()=>change('save',null,draft(0)),/version and action/);
    await assert.rejects(()=>session('authenticated',admin,tx=>tx.exec("update outreach_items set state='scheduled'")),/permission denied/);
    let visible=await session('authenticated',viewer,tx=>tx.query('select * from outreach_items'));assert.equal(visible.rows.length,1);
    visible=await session('authenticated',outsider,tx=>tx.query('select * from outreach_items'));assert.equal(visible.rows.length,0);
    await assert.rejects(()=>session('anon',outsider,tx=>tx.query('select * from outreach_items')),/permission denied/);
    await assert.rejects(()=>change('scheduled',1,{}),/Unsupported admin/);
    await assert.rejects(()=>change('save',1,{...draft(0),recipient:'guessed@h0.test'}),/non-guessed/);
    const gates=Object.fromEntries(Array.from({length:10},(_,i)=>[`G${i+1}`,{result:'pass',evidence:'Verified fixture evidence'}]));
    await assert.rejects(()=>change('review',1,{draft:row.draft,score:100,gates:{}} ,'h0.test','service_role',admin),/Every mandatory/);
    row=await change('review',1,{draft:row.draft,score:95,gates},'h0.test','service_role',admin);
    row=await change('finalise',row.version,{send_at:'2030-01-07T14:00:00Z'});
    await change('save',0,draft(6),'h6.test');
    await assert.rejects(()=>change('finalise',1,{send_at:'2030-01-07T14:00:00Z'},'h6.test'),/Space proposed/);
    await change('finalise',1,{send_at:'2030-01-07T14:10:00Z'},'h6.test');
    await change('park',2,{},'h6.test');

    await assert.rejects(()=>change('lock',row.version,{send_at:'2030-01-07T14:00:00Z'}),/Confirm calendar/);
    await db.query("update dashboards set data=$1 where batch='all'",[{orgs:orgs.map((o,i)=>i?o:{...o,emails:[]})}]);
    await assert.rejects(()=>change('lock',row.version,{send_at:'2030-01-07T14:00:00Z',calendar_checked:true,sending_checks_passed:true}),/recipient is no longer eligible/);
    await db.query("update dashboards set data=$1 where batch='all'",[{orgs}]);
    row=await change('lock',row.version,{send_at:'2030-01-07T14:00:00Z',calendar_checked:true,sending_checks_passed:true});assert.equal(row.state,'locked');
    row=await change('save',row.version,draft(0));assert.equal(row.review,null);assert.equal(row.approved_at,null);assert.equal(row.send_at,null);
    row=await change('finalise',row.version,{send_at:'2030-01-07T14:00:00Z'});
    await assert.rejects(()=>change('lock',row.version,{send_at:'2030-01-07T14:00:00Z',calendar_checked:true,sending_checks_passed:true}),/passing review/);
    row=await change('review',row.version,{draft:row.draft,score:95,gates},'h0.test','service_role',admin);
    row=await change('lock',row.version,{send_at:'2030-01-07T14:00:00Z',calendar_checked:true,sending_checks_passed:true});
    row=await change('begin_scheduling',row.version,{evidence:'Verified recipient eligibility and no duplicate in Gmail'},'h0.test','service_role',admin);
    await assert.rejects(()=>change('save',row.version,draft(0)),/Cancel and verify/);
    await assert.rejects(()=>change('scheduled',row.version,{draft:row.draft,send_at:'2030-01-07T14:10:00Z',gmail_reference:'fixture',evidence:'fixture'},'h0.test','service_role',admin),/does not match/);
    row=await change('scheduled',row.version,{draft:row.draft,send_at:row.send_at,gmail_reference:'fixture-scheduled-message',evidence:'Exact subject, body, recipient and time observed'},'h0.test','service_role',admin);
    assert.equal(row.state,'scheduled');
    const before=await db.query('select count(*)::integer as n from outreach_events');
    await db.query("update dashboards set data=$1 where batch='all'",[{orgs}]);
    assert.equal((await db.query('select state from outreach_items')).rows[0].state,'scheduled');
    assert.equal((await db.query('select count(*)::integer as n from outreach_events')).rows[0].n,before.rows[0].n);
    // The first scheduled message stays intact while five next drafts are prepared.
    const scheduledBefore=structuredClone(row);
    for(let i=1;i<=5;i++)await change('save',0,draft(i),`h${i}.test`);
    assert.deepEqual((await db.query("select to_jsonb(i) as r from outreach_items i where domain='h0.test'")).rows[0].r,scheduledBefore);
    await assert.rejects(()=>change('save',3,draft(6),'h6.test'),/preparation slots are full/);
    await change('park',1,{},'h5.test');await change('save',3,draft(6),'h6.test');
    await assert.rejects(()=>change('prepare',row.version,draft(0),'h0.test','service_role',admin),/Cancel and verify/);
    await change('park',1,{},'h4.test');
    row=await change('cancelled',row.version,{gmail_reference:'fixture-cancelled',evidence:'Gmail cancellation observed'},'h0.test','service_role',admin);
    row=await change('save',row.version,draft(0));assert.equal(row.state,'draft');
    // A synthetic demo is available without adding an org/email to the real shortlist.
    const snapshotBefore=await db.query("select data from dashboards where batch='all'");
    const self={recipient:'maheenejaz@goocampus.in',subject:'[SELF-TEST] Fixture',body:'This is a self-only demonstration. Fictional provider; no real outreach.',timezone:'Asia/Kolkata',timezone_source:'User-configured demo timezone'};
    await assert.rejects(()=>change('save',0,{...self,recipient:'office@h1.test'},'demo-self.invalid'),/office inbox/);
    await assert.rejects(()=>change('save',0,{...self,subject:'Normal proposal'},'demo-self.invalid'),/labelled test/);
    await assert.rejects(()=>change('save',0,self,'demo-self.invalid','authenticated',viewer),/Only Maheen/);
    let demo=await change('save',0,self,'demo-self.invalid');
    await assert.rejects(()=>change('review',demo.version,{draft:demo.draft,score:95,gates},'demo-self.invalid','service_role',admin),/self-only demo/);
    demo=await change('review',demo.version,{draft:demo.draft,score:95,gates,scope:'self_only_demo'},'demo-self.invalid','service_role',admin);
    demo=await change('finalise',demo.version,{send_at:'2030-01-05T12:40:00Z'},'demo-self.invalid');
    demo=await change('lock',demo.version,{send_at:'2030-01-05T12:40:00Z',calendar_checked:true,sending_checks_passed:true},'demo-self.invalid');
    assert.equal(demo.state,'locked'); // Not automatically scheduled.
    demo=await change('unlock',demo.version,{},'demo-self.invalid');assert.equal(demo.approved_at,null);
    demo=await change('lock',demo.version,{send_at:'2030-01-05T12:50:00Z',calendar_checked:true,sending_checks_passed:true},'demo-self.invalid');
    assert.match(demo.send_at,/12:50/);
    demo=await change('save',demo.version,self,'demo-self.invalid');assert.equal(demo.review,null);assert.equal(demo.approved_at,null);
    assert.deepEqual((await db.query("select data from dashboards where batch='all'")).rows,snapshotBefore.rows);
    // Normal providers still reject Saturday approval.
    row=await change('review',row.version,{draft:row.draft,score:95,gates},'h0.test','service_role',admin);
    row=await change('finalise',row.version,{send_at:'2030-01-05T15:00:00Z'});
    await assert.rejects(()=>change('lock',row.version,{send_at:'2030-01-05T15:00:00Z',calendar_checked:true,sending_checks_passed:true}),/business day/);
    await db.exec("delete from dashboard_viewers where email='maheenejaz@goocampus.in'");
    await assert.rejects(()=>change('save',row.version,draft(0)),/Only Maheen/);
  } finally {await db.close();}
});
