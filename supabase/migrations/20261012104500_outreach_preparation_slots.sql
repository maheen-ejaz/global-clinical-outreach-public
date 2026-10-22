-- Completed/scheduled history does not consume preparation slots.
-- Keep the five-at-a-time preparation guard, owner approval and Gmail reconciliation.
create or replace function private.change_outreach(p_domain text, p_version integer, p_action text, p_data jsonb, p_operator boolean)
returns public.outreach_items language plpgsql security definer set search_path = '' as $$
declare
  r public.outreach_items;
  provider jsonb;
  address jsonb;
  actor text;
  t timestamptz;
  local_time timestamp;
  gate text;
  is_demo boolean := p_domain = 'demo-self.invalid';
begin
  if p_domain is null or p_version is null or p_action is null or p_operator is null then raise exception 'Domain, version and action are required'; end if;
  if p_operator then
    if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Operator access required'; end if;
    if p_action not in ('prepare','review','begin_scheduling','scheduled','sent','cancelled','send_failed','checked','reply') then
      raise exception 'Unsupported operator action';
    end if;
    actor := 'Gmail operator';
  else
    if not private.is_outreach_admin() then raise exception 'Only Maheen can edit or approve outreach'; end if;
    if p_action not in ('save','finalise','lock','unlock','park','suppress') then raise exception 'Unsupported admin action'; end if;
    actor := 'maheenejaz@goocampus.in';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Object required'; end if;
  -- Serialises pilot reservations and send-time conflicts across different providers.
  perform pg_advisory_xact_lock(15391010);
  select * into r from public.outreach_items where domain = p_domain for update;
  if not found then
    if p_action <> 'save' or p_version <> 0 then raise exception 'Select a provider first'; end if;
    insert into public.outreach_items(domain,version) values (p_domain,0) returning * into r;
  end if;
  if r.version <> p_version then raise exception 'This row changed. Refresh before trying again'; end if;
  if is_demo and p_action not in ('save','prepare') and coalesce(r.draft->>'recipient','') <> 'maheenejaz@goocampus.in' then
    raise exception 'Self-test recipient must remain the office inbox';
  end if;
  if p_action in ('save','prepare','finalise','lock','begin_scheduling') then
    if is_demo then
      provider := jsonb_build_object('domain','demo-self.invalid','name','Maheen Demo Clinical Provider — SELF-TEST',
        'emails',jsonb_build_array(jsonb_build_object('address','maheenejaz@goocampus.in','kind','demo_self','status','self_confirmed',
          'source_url','https://outreach.goocampusglobal.com/?view=outreach&demo=self')));
    else
    select o into provider from public.dashboards d, jsonb_array_elements(d.data->'orgs') o
      where d.batch = 'all' and o->>'domain' = p_domain and o->'target'->>'ready' = 'true' limit 1;
    end if;
    if provider is null then raise exception 'Provider is no longer eligible in the published shortlist'; end if;
    if p_action in ('finalise','lock','begin_scheduling') and not exists (
      select 1 from jsonb_array_elements(provider->'emails') e where e->>'address' = r.draft->>'recipient'
      and e->>'kind' <> 'pattern_guess' and coalesce(e->>'status','unknown') <> 'invalid'
      and coalesce(e->>'source_url','') <> ''
    ) then raise exception 'The selected recipient is no longer eligible'; end if;
  end if;
  if p_action in ('save','prepare') then
    if r.state not in ('draft','finalised','locked','parked','cancelled') then
      raise exception 'Cancel and verify the Gmail schedule before editing';
    end if;
    if p_action = 'prepare' and r.state <> 'draft' then raise exception 'Only prepare an editable draft'; end if;
    if not is_demo and (select count(*) from public.outreach_items where domain not in (p_domain,'demo-self.invalid') and state in ('draft','finalised','locked','scheduling')) >= 5 then
      raise exception 'The five-provider preparation slots are full';
    end if;
    if is_demo and (coalesce(p_data->>'recipient','') <> 'maheenejaz@goocampus.in'
      or (coalesce(p_data->>'subject','') <> '' and left(p_data->>'subject',11) <> '[SELF-TEST]')
      or (coalesce(p_data->>'body','') <> '' and position('self-only demonstration' in lower(p_data->>'body')) = 0)) then
      raise exception 'Self-test must use only the office inbox and clearly labelled test content';
    end if;
    if length(coalesce(p_data->>'subject','')) > 250 or length(coalesce(p_data->>'body','')) > 20000 then raise exception 'Draft too long'; end if;
    select e into address from jsonb_array_elements(provider->'emails') e
      where e->>'address' = p_data->>'recipient' and e->>'kind' <> 'pattern_guess'
      and coalesce(e->>'status','unknown') <> 'invalid' and coalesce(e->>'source_url','') <> '' limit 1;
    if address is null then raise exception 'Choose a shortlisted, sourced, non-guessed recipient'; end if;
    r.draft := jsonb_build_object('recipient',address->>'address','recipient_source',address->>'source_url',
      'subject',coalesce(p_data->>'subject',''),'body',coalesce(p_data->>'body',''),
      'timezone',coalesce(p_data->>'timezone',''),'timezone_source',coalesce(p_data->>'timezone_source',''));
    r.review := null; r.send_at := null; r.approved_at := null; r.gmail_reference := null; r.state := 'draft';
  elsif p_action = 'review' then
    if is_demo and coalesce(p_data->>'scope','') <> 'self_only_demo' then raise exception 'Label the review as a self-only demo'; end if;
    if r.state not in ('draft','finalised') then raise exception 'Review the current draft before locking'; end if;
    if p_data->'draft' is distinct from r.draft then raise exception 'Review does not match this draft'; end if;
    if coalesce((p_data->>'score')::integer,0) < 90 or (p_data->>'score')::integer > 100 then raise exception 'Review score must be 90–100'; end if;
    foreach gate in array array['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10'] loop
      if coalesce(p_data->'gates'->gate->>'result','') <> 'pass' or length(trim(coalesce(p_data->'gates'->gate->>'evidence',''))) = 0 then
        raise exception 'Every mandatory rule needs a pass with evidence';
      end if;
    end loop;
    r.review := p_data;
  elsif p_action = 'finalise' then
    if r.state <> 'draft' or trim(r.draft->>'subject') = '' or trim(r.draft->>'body') = '' then raise exception 'Save a complete editable draft first'; end if;
    if r.draft->>'timezone' not in (select name from pg_timezone_names) or trim(r.draft->>'timezone_source') = '' then
      raise exception 'Verify the recipient timezone and record its source';
    end if;
    t := (p_data->>'send_at')::timestamptz;
    if t is null or t <= now() then raise exception 'Choose a future proposed time'; end if;
    if exists (select 1 from public.outreach_items where domain <> p_domain and (domain = 'demo-self.invalid') = is_demo and state in ('finalised','locked','scheduling','scheduled')
      and abs(extract(epoch from (send_at-t))) < 600) then raise exception 'Space proposed messages at least ten minutes apart'; end if;
    r.send_at := t;
    r.state := 'finalised';
  elsif p_action = 'lock' then
    if r.state <> 'finalised' then raise exception 'Finalise this draft first'; end if;
    if r.review is null or r.review->'draft' is distinct from r.draft then raise exception 'The current draft needs a passing review before approval'; end if;
    if coalesce(p_data->>'calendar_checked','false') <> 'true' or coalesce(p_data->>'sending_checks_passed','false') <> 'true' then raise exception 'Confirm calendar and sending checks'; end if;
    t := (p_data->>'send_at')::timestamptz;
    if t is null or t <= now() then raise exception 'Choose a future send time'; end if;
    local_time := t at time zone (r.draft->>'timezone');
    if not is_demo and extract(isodow from local_time) > 5 then raise exception 'Choose a recipient-local business day'; end if;
    if exists (select 1 from public.outreach_items where domain <> p_domain and (domain = 'demo-self.invalid') = is_demo and state in ('finalised','locked','scheduling','scheduled')
      and abs(extract(epoch from (send_at-t))) < 600) then raise exception 'Space messages at least ten minutes apart'; end if;
    r.send_at := t; r.approved_at := now(); r.state := 'locked';
  elsif p_action = 'unlock' then
    if r.state <> 'locked' then raise exception 'Only an unscheduled lock can be reopened'; end if;
    r.state := 'finalised'; r.approved_at := null; r.send_at := null;
  elsif p_action = 'park' then
    if r.state not in ('draft','finalised','parked') then raise exception 'Reopen or cancel before removing a pilot selection'; end if;
    r.state := 'parked';
  elsif p_action = 'suppress' then
    if r.state in ('scheduling','scheduled') then raise exception 'Cancel and verify the Gmail schedule first'; end if;
    r.state := 'suppressed'; r.approved_at := null;
  elsif p_action = 'begin_scheduling' then
    if r.state <> 'locked' or r.send_at <= now() then raise exception 'A future locked approval is required'; end if;
    if trim(coalesce(p_data->>'evidence','')) = '' then raise exception 'Record the pre-scheduling eligibility and Gmail duplicate check'; end if;
    r.state := 'scheduling';
  elsif p_action = 'scheduled' then
    if r.state <> 'scheduling' then raise exception 'Reserve scheduling first'; end if;
    if p_data->'draft' is distinct from r.draft or (p_data->>'send_at')::timestamptz is distinct from r.send_at then raise exception 'Gmail does not match the approved version'; end if;
    if trim(coalesce(p_data->>'gmail_reference','')) = '' or trim(coalesce(p_data->>'evidence','')) = '' then raise exception 'Verified Gmail reference and evidence required'; end if;
    r.gmail_reference := p_data->>'gmail_reference'; r.last_checked_at := now(); r.state := 'scheduled';
  elsif p_action in ('sent','cancelled','send_failed') then
    if r.state not in ('scheduling','scheduled') then raise exception 'No active Gmail schedule to reconcile'; end if;
    if trim(coalesce(p_data->>'gmail_reference','')) = '' or trim(coalesce(p_data->>'evidence','')) = '' then raise exception 'Verified Gmail reference and evidence required'; end if;
    r.gmail_reference := p_data->>'gmail_reference'; r.last_checked_at := now(); r.state := p_action;
    if p_action = 'cancelled' then r.approved_at := null; end if;
  elsif p_action in ('checked','reply') then
    if trim(coalesce(p_data->>'evidence','')) = '' then raise exception 'Observed Gmail evidence required'; end if;
    if p_action = 'reply' and coalesce(p_data->>'outcome','') not in ('positive','negative','neutral','redirect','automatic','unclear','opt_out','bounce') then raise exception 'Choose an observed reply outcome'; end if;
    if p_action = 'reply' and p_data->>'outcome' = 'opt_out' then
      if r.state in ('scheduled','scheduling') then raise exception 'Cancel the pending Gmail schedule first'; end if;
      r.state := 'suppressed'; r.approved_at := null;
    end if;
    r.last_checked_at := now();
  end if;
  r.version := r.version + 1; r.updated_at := now();
  update public.outreach_items set version=r.version,state=r.state,draft=r.draft,review=r.review,send_at=r.send_at,
    approved_at=r.approved_at,gmail_reference=r.gmail_reference,last_checked_at=r.last_checked_at,updated_at=r.updated_at
    where domain=p_domain;
  insert into public.outreach_events(domain,version,action,actor,snapshot,evidence)
    values (p_domain,r.version,p_action,actor,to_jsonb(r),p_data);
  return r;
end;
$$;
