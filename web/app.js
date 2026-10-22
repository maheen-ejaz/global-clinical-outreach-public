// Hosted dashboard boot: sign in with an emailed link (Supabase Auth), then load a published snapshot.
// The publishable key is public by design; what a session may read is decided by the database policy on
// `dashboards` (only addresses in dashboard_viewers). See docs/pipeline-runbook.md, "Hosted dashboard".
(() => {
  const SUPABASE_URL = "https://wevhojfgxckximznhvbh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_tDc8TLEL3Al-xb2tPyrLiQ_emC4w302";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  const $ = (id) => document.getElementById(id);
  const boot = $("bootStatus");

  function showLogin(message = "") {
    boot.hidden = true;
    $("app").hidden = true;
    $("outreachEditor").hidden = true;
    $("oe-body").value = "";
    $("login").hidden = false;
    $("loginStatus").textContent = message;
  }

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("email").value.trim().toLowerCase();
    $("loginBtn").disabled = true;
    $("loginStatus").textContent = "Sending…";
    // shouldCreateUser: false — only accounts created by `outreach viewers` can sign in.
    const { error } = await client.auth.signInWithOtp({
      email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/` },
    });
    $("loginBtn").disabled = false;
    // Same message either way, so the page does not reveal which addresses have an account.
    $("loginStatus").textContent = error && error.status === 429
      ? "Too many requests. Wait a minute and try again."
      : "If this address is allowed, a sign-in link is on its way. Open it in this browser.";
  });

  $("signOut").onclick = async () => {
    await client.auth.signOut();
    location.replace("/");
  };

  async function start() {
    const params = new URLSearchParams(location.search);
    const linkError = params.get("error_description") || new URLSearchParams(location.hash.slice(1)).get("error_description");
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      if(params.get('demo')==='self')localStorage.setItem('outreachDemoIntent',JSON.stringify({mode:'self',expires:Date.now()+15*60000}));
      return showLogin(linkError ? `Sign-in link failed: ${linkError}. Request a new one.` : "");
    }
    // Nonsecret UI intent survives a magic-link callback in a new tab; it grants no access.
    try {
      const intent=JSON.parse(localStorage.getItem('outreachDemoIntent')||'null');
      if(params.has('code')&&intent?.mode==='self'&&intent.expires>Date.now()){params.set('demo','self');params.set('view','outreach');}
    }catch{}
    localStorage.removeItem('outreachDemoIntent');
    if(params.has('code')){
      const clean=new URLSearchParams();
      for(const key of ['batch','view','demo'])if(params.get(key))clean.set(key,params.get(key));
      history.replaceState(null,'',location.pathname+(clean.size?'?'+clean:''));
    }
    if(params.get('demo')==='self'){
      boot.hidden=true;$('login').hidden=true;$('app').hidden=false;
      for(const id of ['tab-overview','tab-detail','panel-overview','panel-detail','export','theme'])$(id).hidden=true;
      $('tab-outreach').setAttribute('aria-selected','true');$('tab-outreach').tabIndex=0;
      $('panel-outreach').hidden=false;$('subtitle').textContent='Self-only demo · real provider records are not loaded';
      await window.startOutreach(client,{orgs:[]},session.user.email);
      return;
    }

    const { data: list, error } = await client.from("dashboards").select("batch,label,published_at").order("batch");
    if (error) return showLogin(`Could not load dashboards: ${error.message}`);
    if (!list.length) {
      boot.textContent = `Signed in as ${session.user.email}, but this account has no dashboards to view.`;
      boot.append(" ", Object.assign(document.createElement("button"), { className: "btn", textContent: "Sign out", onclick: $("signOut").onclick }));
      return;
    }
    const overview = list.find((row) => row.batch === "all");
    if (!overview) { boot.textContent = "The all-batches overview is not available yet."; return; }
    const wanted = params.get("batch");
    const current = list.find((row) => row.batch === wanted) || overview;
    const loadSnapshot = (batch) => client.from("dashboards").select("data").eq("batch", batch).single();
    const [{ data: overviewRow, error: overviewError }, detailResult] = await Promise.all([
      loadSnapshot(overview.batch),
      current.batch === overview.batch ? Promise.resolve(null) : loadSnapshot(current.batch),
    ]);
    if (overviewError) { boot.textContent = `Could not load all batches: ${overviewError.message}`; return; }
    const detailRow = detailResult?.data || overviewRow;
    if (detailResult?.error) { boot.textContent = `Could not load ${current.batch}: ${detailResult.error.message}`; return; }

    const pick = $("batchPick");
    // "All batches" first, then each batch in order.
    for (const item of [...list].sort((a, b) => (b.batch === "all") - (a.batch === "all") || a.batch.localeCompare(b.batch))) {
      pick.append(Object.assign(document.createElement("option"), { value: item.batch, textContent: item.label, selected: item.batch === current.batch }));
    }
    pick.onchange = () => { location.search = `?batch=${encodeURIComponent(pick.value)}&view=detail`; };

    boot.hidden = true;
    $("login").hidden = true;
    $("app").hidden = false;
    window.renderDashboard(overviewRow.data, detailRow.data, current.label || current.batch);
    await window.startOutreach(client, overviewRow.data, session.user.email);
    if (params.get("view") === "outreach") $("tab-outreach").click();
    if (params.get("view") === "detail") $("tab-detail").click();
  }

  client.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") showLogin(); });
  start().catch((error) => showLogin(`Something went wrong: ${error.message}`));
})();
