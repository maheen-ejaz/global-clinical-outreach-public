import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('web');
const fixture={orgs:[{domain:'hospital.test',name:'Fixture Hospital',website:'https://hospital.test',target:{ready:true},programs:[],emails:[{address:'office@hospital.test',kind:'generic_inbox',status:'unknown',source_url:'https://hospital.test/contact'}]}]};
const boot=admin=>`
const snapshot=${JSON.stringify(fixture)};
let rows=[],events=[];window.fixtureActions=[];
const client={from(table){return {select(){return this},eq(){return this},order(){return this},limit(){return this},range(){return this},then(resolve){resolve({data:table==='outreach_items'?rows:events,error:null})}}},async rpc(fn,p){
window.fixtureActions.push(p.p_action);let r=rows[0]||{domain:p.p_domain,version:0,state:'draft',draft:{}};
if(p.p_action==='save'){r={...r,draft:p.p_data,state:'draft',review:null};}
if(p.p_action==='finalise'){r={...r,state:'finalised',send_at:p.p_data.send_at};}
if(p.p_action==='lock'){r={...r,state:'locked',send_at:p.p_data.send_at};}
r.version++;r.updated_at=new Date().toISOString();rows=[r];events.unshift({domain:r.domain,version:r.version,action:p.p_action,recorded_at:r.updated_at,snapshot:r,evidence:p.p_data});return {data:r,error:null};}};
document.getElementById('bootStatus').hidden=true;document.getElementById('app').hidden=false;
// Same tab interaction as the hosted dashboard, without production auth or prospect calls.
for(const t of document.querySelectorAll('[role=tab]'))t.onclick=()=>{for(const x of document.querySelectorAll('[role=tab]')){const on=x===t;x.setAttribute('aria-selected',on);document.getElementById(x.getAttribute('aria-controls')).hidden=!on;}};
window.startOutreach(client,snapshot,'${admin?'maheenejaz':'ashwini.s'}@goocampus.in');
document.getElementById('tab-outreach').click();`;
test('private Outreach editor renders on mobile and desktop and preserves explicit finalisation',async()=>{
  const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/')&&p!==root)throw Error();const file=p===root+'/'||p===root?root+'/index.html':p;const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:boot(true)}));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator('#outreachTable tbody td').first().evaluate(e=>e.textContent='American Clinical Experience (ACE) — A long provider name');
    const selectAction=page.getByRole('button',{name:'Select',exact:true});
    assert.ok(await selectAction.evaluate(e=>e.scrollWidth<=e.clientWidth));
    assert.equal(await selectAction.evaluate(e=>e.getBoundingClientRect().height),36);
    await selectAction.click();
    await page.locator('#oe-subject').fill('Fixture proposal');await page.locator('#oe-body').fill('A private draft for review.');
    await page.locator('#oe-timezone').fill('America/New_York');await page.locator('#oe-timezone_source').fill('https://hospital.test/location');
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await page.getByRole('button',{name:'Finalise and propose time',exact:true}).click();
    await page.locator('#outreachTime').waitFor({state:'visible'});
    assert.match(await page.locator('#outreachLocalTime').textContent(),/Recipient:.*America\/New_York · IST:.* IST/);
    assert.match(await page.locator('#outreachReview').textContent(),/No passing review/);
    assert.equal(await page.getByRole('columnheader',{name:'Scheduled time (IST)',exact:true}).count(),1);
    for(const theme of ["light","dark"])for(const width of [1440,768,390,320]){
      await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      for(const id of ['outreachFilter','oe-recipient']) {
        const style=await page.locator('#'+id).evaluate(e=>({height:e.getBoundingClientRect().height,padding:getComputedStyle(e).paddingRight,position:getComputedStyle(e).backgroundPosition,arrow:getComputedStyle(e).backgroundImage}));
        assert.ok(style.height>=44);assert.equal(style.padding,'40px');assert.match(style.position,/12px/);assert.match(style.arrow,/svg/);
      }
      const action=page.locator('#outreachTable tbody .btn').first();
      assert.equal(await action.evaluate(e=>getComputedStyle(e).whiteSpace),'nowrap');
      assert.ok(await action.evaluate(e=>e.scrollWidth<=e.clientWidth));
      assert.ok(await page.locator('#outreachTable tbody td:last-child').first().evaluate(e=>e.getBoundingClientRect().width>=100));
      await page.locator('#outreachFilter').focus();
      assert.equal(await page.locator('#outreachFilter').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');
      await page.screenshot({path:`/tmp/outreach-workspace-${theme}-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);
    await page.unroute('**/app.js');await page.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:boot(false)}));
    await page.reload();await page.locator('#outreachCounts').getByText('shortlisted providers',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Select',exact:true}).isDisabled(),true);
    assert.match(await page.locator('#outreachAccess').textContent(),/View only/);
    await page.unroute('**/app.js');await page.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:boot(true)}));
    await page.goto(`http://127.0.0.1:${server.address().port}/?view=outreach&demo=self`);
    await page.getByRole('button',{name:'Select',exact:true}).click();
    assert.equal(await page.locator('#oe-recipient').isDisabled(),true);
    assert.equal(await page.locator('#oe-recipient').inputValue(),'maheenejaz@goocampus.in');
    assert.equal(await page.getByText('Fixture Hospital',{exact:true}).count(),0);
    await page.locator('#oe-subject').fill('[SELF-TEST] Fixture');await page.locator('#oe-body').fill('This is a self-only demonstration.');
    await page.locator('#oe-timezone').fill('Asia/Kolkata');await page.locator('#oe-timezone_source').fill('Configured demo timezone');
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await page.getByRole('button',{name:'Finalise and propose time',exact:true}).click();
    await page.locator('#outreachTime').waitFor({state:'visible'});
    const suggested=await page.evaluate(()=>Date.parse(OutreachModel.localInstant(document.getElementById('oe-time').value,'Asia/Kolkata')));
    assert.ok(suggested-Date.now()>9*60000 && suggested-Date.now()<11*60000);
    const edited=await page.evaluate(()=>OutreachModel.localValue(Date.now()+20*60000,'Asia/Kolkata'));
    await page.locator('#oe-time').fill(edited);assert.equal(await page.locator('#oe-time').inputValue(),edited);
    await page.locator('#oe-calendar').check();await page.locator('#oe-checks').check();
    await page.getByRole('button',{name:'Lock approval for Gmail scheduling',exact:true}).click();
    assert.match(await page.locator('#outreachState').textContent(),/Locked.*awaiting Gmail/);
    assert.deepEqual(await page.evaluate(()=>window.fixtureActions),['save','finalise','lock']);
    assert.match(await page.locator('#outreachCounts').textContent(),/Does not use a pilot slot/);
    // Exercise real boot code, including a fresh magic-link callback, with an offline auth fixture.
    const isolated=await browser.newContext();const fresh=await isolated.newPage();
    await fresh.route('**/vendor/supabase-2.45.4.js',route=>route.fulfill({contentType:'text/javascript',body:`
      window.fixtureQueries=[];window.supabase={createClient:()=>({
        auth:{onAuthStateChange(){},async getSession(){return {data:{session:location.search.includes('code=fixture')?{user:{email:'maheenejaz@goocampus.in'}}:null}};}},
        from(table){const entry={table,filters:[]};window.fixtureQueries.push(entry);return {select(){return this},eq(k,v){entry.filters.push([k,v]);return this},order(){return this},limit(){return this},range(){return this},then(resolve){resolve({data:[],error:null});}};}
      })};` }));
    await fresh.goto(`http://127.0.0.1:${server.address().port}/?view=outreach&demo=self`);
    await fresh.locator('#login').waitFor({state:'visible'});
    await fresh.goto(`http://127.0.0.1:${server.address().port}/?code=fixture`);
    await fresh.getByText('Self-test provider · Not selected · Does not use a pilot slot',{exact:true}).waitFor();
    assert.match(fresh.url(),/demo=self/);
    for(const id of ['tab-overview','tab-detail','export'])assert.equal(await fresh.locator('#'+id).isVisible(),false);
    const queries=await fresh.evaluate(()=>window.fixtureQueries);
    assert.deepEqual(queries.map(q=>q.table),['outreach_items','outreach_events']);
    assert.ok(queries.every(q=>JSON.stringify(q.filters)==='[["domain","demo-self.invalid"]]'));
    await isolated.close();


  }finally{await browser.close();await new Promise(r=>server.close(r));}
});
