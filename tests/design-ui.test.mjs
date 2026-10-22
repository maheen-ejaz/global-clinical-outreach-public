import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('web');
const source='https://hospital.test/programme';
const snapshot={tool_usage:{firecrawl:{credits:818,checked_at:'2026-10-15T17:17:11Z',api_key_name:'global-clinical-outreach-v1',source_url:'https://www.firecrawl.dev/app/t/YduQUzfnY3X/usage',period_start:'2026-07-15',period_end:'2026-10-15'},reoon:{verifications:388,checked_at:'2026-10-16T01:09:59Z'}},generated_at:'2026-12-31T20:00:00Z',runs:[],targeting_profile:{name:'Fixture rules'},meta:{batch:'all',label:'Fixture research'},orgs:[{
  domain:'hospital.test',name:'Fixture Hospital',type:'community',website:source,city:'London',country:'GB',pages:4,
  priority:1,pitch:'A sourced programme description for international graduates. This fixture contains no real provider records.',
  target:{ready:true,score:90,reasons:['Published programme inbox']},programs:[{name:'Clinical observership',type:'observership',fee_status:'free',window_status:'rolling',source_url:source}],
  people:[{name:'Fixture Coordinator',title:'Programme coordinator',source_url:source}],
  emails:[{address:'office@hospital.test',kind:'generic_inbox',status:'valid',source_url:source}]
}]};

test('v2 design covers sign-in, research tables and expanded records in both themes and sizes',async()=>{
  const server=createServer(async(req,res)=>{try{
    const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!p.startsWith(root+'/')&&p!==root)throw Error();
    const file=p===root?root+'/index.html':p;
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');
    res.end(await readFile(file));
  }catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const evidence='/tmp/attio-mono-v2';await mkdir(evidence,{recursive:true});
  try{
    for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
      const page=await browser.newPage({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',timezoneId:'America/Los_Angeles'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:`
        document.getElementById('bootStatus').hidden=true;
        document.getElementById('login').hidden=false;` }));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      // Formatting must be available before dashboard rendering, including the self-demo boot path.
      assert.equal(await page.evaluate(()=>window.formatTimestamp(null)),'—');
      assert.equal(await page.evaluate(()=>window.formatTimestamp('2026-01-01T00:30:00Z','America/New_York')),'December 31st, 2025, 19:30 America/New_York');
      assert.equal(await page.locator('#email').getAttribute('aria-describedby'),'loginHelp loginStatus');
      await page.locator('#email').focus();
      assert.equal(await page.locator('#email').evaluate(e=>getComputedStyle(e).fontSize),'16px');
      assert.equal(await page.locator('#email').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');
      await page.locator('#loginBtn').evaluate(e=>e.disabled=true);
      assert.equal(await page.locator('#loginBtn').evaluate(e=>getComputedStyle(e).opacity),'0.4');
      await page.screenshot({path:`${evidence}/login-${theme}-${width}.png`,fullPage:true});
      await page.evaluate(data=>{
        document.getElementById('login').hidden=true;document.getElementById('app').hidden=false;
        window.renderDashboard(data,data,'Fixture research');
      },snapshot);
      await page.evaluate(async data=>{
        const rows=[{domain:'hospital.test',state:'sent',draft:{recipient:'office@hospital.test'},last_checked_at:'2026-10-12T10:00:00Z'},{domain:'demo-self.invalid',state:'sent',draft:{}}];
        const events=[{domain:'hospital.test',version:1,action:'sent',recorded_at:'2026-10-01T10:00:00Z'},{domain:'hospital.test',version:2,action:'reply',evidence:{outcome:'positive'}}];
        const client={from(table){return {select(){return this},order(){return this},range(){return Promise.resolve({data:table==='outreach_items'?rows:events,error:null});}}}};
        await window.startOutreach(client,data,'ashwini.s@goocampus.in');
      },snapshot);
      assert.match(await page.locator('#subtitle').textContent(),/January 1st, 2027, 01:30 IST/);
      assert.match(await page.locator('#outreachOverviewStatus').textContent(),/October 12th, 2026, 15:30 IST/);
      assert.match(await page.locator('#workSummary .note').textContent(),/Saved snapshot; use the links for current usage/);
      assert.match(await page.locator('#workSummary .note').textContent(),/reporting dates \(UTC\): July 15th, 2026 – October 15th, 2026/);
      assert.equal(await page.getByRole('link',{name:'View Firecrawl live usage (opens in a new tab)'}).getAttribute('href'),'https://www.firecrawl.dev/app/t/YduQUzfnY3X/usage');
      assert.equal(await page.getByRole('link',{name:'View Reoon live usage (opens in a new tab)'}).getAttribute('href'),'https://emailverifier.reoon.com/overview/');
      const cells=await page.locator('.work-cost').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
      assert.ok(Math.abs(cells[0]-cells[1])<1,'usage cells have equal widths');
      assert.equal(await page.locator('[data-metric="sent"] .v').textContent(),'1');
      assert.equal(await page.locator('[data-metric="responded"] .v').textContent(),'1');
      assert.equal(await page.locator('[data-metric="interested"] .v').textContent(),'1');
      assert.match(await page.locator('#outreachOverviewStatus').textContent(),/Latest recorded Gmail check/);
      await page.locator('#overviewActivityRefresh').click();
      await page.evaluate(async data=>{
        const counts={sent:25,responded:0,interested:0,rejected:0,other:0,awaiting:25,cold:0,automatic:4,delivery:0,scheduled:60,awaiting_review:20,total_contacts:105};
        const saved={...data,activity_summary:{version:1,checked_at:'2026-10-15T16:00:00Z',source:'Gmail/Attio session check',counts}};
        const client={from(){return {select(){return this},order(){return this},range(){return Promise.resolve({data:[],error:null})}}}};
        await window.startOutreach(client,saved,'ashwini.s@goocampus.in');
      },snapshot);
      assert.equal(await page.locator('[data-metric="sent"] .v').textContent(),'25');
      assert.match(await page.locator('#outreachOverviewExtra').textContent(),/60 scheduled.*4 emails with automatic replies/);
      assert.match(await page.locator('#outreachOverviewStatus').textContent(),/105 tracked contacts · 20 awaiting review/);
      await page.locator('#overviewActivityOpen').click();
      assert.equal(await page.locator('#panel-outreach').isVisible(),true);
      await page.locator('#tab-overview').click();
      assert.equal(await page.locator('#reachoutTable tbody tr').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.ok(await page.locator('.wrap').evaluate(e=>e.getBoundingClientRect().width)<=1024);
      await page.screenshot({path:`${evidence}/overview-${theme}-${width}.png`,fullPage:true});
      await page.locator('#tab-detail').click();
      await page.locator('.row-head').first().click();
      assert.equal(await page.locator('.detail').first().isVisible(),true);
      for(const button of await page.locator('#teamViews button').all()){
        await button.click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        assert.ok(await page.locator('#teamTable th').count()>0);
      }
      await page.keyboard.press('Tab');
      await page.locator('.funnel-row').first().focus();
      assert.equal(await page.locator('.funnel-row .tip').first().isVisible(),true);
      assert.notEqual(await page.locator('.funnel-row .tip').first().evaluate(e=>getComputedStyle(e).boxShadow),'none');
      assert.equal(await page.locator('.card').first().evaluate(e=>getComputedStyle(e).boxShadow),'none');
      assert.ok(await page.locator('.btn').first().evaluate(e=>getComputedStyle(e).transitionDuration.split(',').every(v=>parseFloat(v)===0)));
      await page.screenshot({path:`${evidence}/research-${theme}-${width}.png`,fullPage:true});
      assert.deepEqual(errors,[]);
      await page.close();
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));}
});
