import {
  ANALYSIS_REVISION,
  MAX_REQUESTS,
  NO_EVIDENCE,
  PilotError,
  PROTOCOL_ID,
  estimateCost,
  exactKeys,
  validateAttempts,
  validateStimuli,
} from './protocol.mjs';

function positiveEvidenceMatches(status, text) {
  const lowered = text.toLowerCase();
  if (status === 'fixed_dates') {
    const fixedSignal = /\b(deadline|intake|closing date|fixed date|closes? on|closed on|applications? close)\b/i.test(text);
    return fixedSignal && /\b\d{1,2}\b/.test(text);
  }
  if (status === 'rolling') {
    if (/\b(not|no|never)\b/i.test(text)) return false;
    return /\baccepted throughout the year\b/i.test(text)
      || /\baccepts? applications? at any time\b/i.test(text)
      || /\byear-round\b/i.test(text)
      || /\bmonthly\b.{0,80}\bstarts?\b/i.test(text)
      || /\bstarts?\b.{0,80}\bmonthly\b/i.test(text)
      || /\beach month\b/i.test(text);
  }
  return false;
}

function requireGold(stimuli, gold, allowDraft) {
  if (!gold
    || gold.version !== 1
    || !Array.isArray(gold.cases)
    || gold.cases.length !== 40
    || gold.independent_review?.status_labels_agreed !== 40
    || gold.independent_review?.reviewed_before_typesafe_output !== true
    || gold.independent_review?.parent_adjudicated_evidence_ids !== true
    || (!allowDraft && !['parent_adjudicated_provisional', 'parent_adjudicated'].includes(gold.review_status))
    || (allowDraft && !['pending_parent_blind_review', 'parent_adjudicated_provisional', 'parent_adjudicated'].includes(gold.review_status))) {
    throw new PilotError('GOLD_NOT_ADJUDICATED');
  }
  const stimuliById = new Map(stimuli.cases.map((item) => [item.stimulus_id, item]));
  const goldById = new Map();
  for (const row of gold.cases) {
    const stimulus = stimuliById.get(row.stimulus_id);
    if (!stimulus
      || goldById.has(row.stimulus_id)
      || !['fixed_dates', 'rolling', 'not_stated', 'not_checked', 'unclear'].includes(row.expected_window_status)
      || typeof row.expected_evidence_id !== 'string') {
      throw new PilotError('INVALID_GOLD');
    }
    const positive = ['fixed_dates', 'rolling'].includes(row.expected_window_status);
    if (positive) {
      const candidate = stimulus.candidate_paragraphs.find((item) => item.candidate_id === row.expected_evidence_id);
      const page = candidate && stimulus.pages.find((item) => item.page_id === candidate.page_id);
      if (!candidate
        || !page
        || row.expected_exact_quote !== candidate.paragraph
        || row.expected_source_url !== page.source_url) {
        throw new PilotError('INVALID_GOLD_EVIDENCE');
      }
      if (!positiveEvidenceMatches(row.expected_window_status, candidate.paragraph)) {
        throw new PilotError('GOLD_EVIDENCE_STATUS_MISMATCH');
      }
    } else if (row.expected_evidence_id !== NO_EVIDENCE
      || row.expected_source_url !== null
      || row.expected_exact_quote !== null) {
      throw new PilotError('INVALID_GOLD_NEGATIVE_EVIDENCE');
    }
    goldById.set(row.stimulus_id, row);
  }
  if (goldById.size !== 40) throw new PilotError('INVALID_GOLD');
  return { goldById, stimuliById };
}

function requireAgentBaseline(baseline, stimuli, goldById) {
  if (!baseline
    || baseline.version !== 1
    || baseline.review_status !== 'completed_before_typesafe_output'
    || baseline.method !== 'current_agent_manual_extraction_from_frozen_synthetic_pages'
    || baseline.reviewed_before_typesafe_output !== true
    || !baseline.window_status_by_stimulus
    || typeof baseline.window_status_by_stimulus !== 'object') {
    return null;
  }
  const allIds = stimuli.cases.map((item) => item.stimulus_id);
  const baselineIds = Object.keys(baseline.window_status_by_stimulus);
  if (baselineIds.length !== allIds.length
    || allIds.some((id) => !Object.hasOwn(baseline.window_status_by_stimulus, id))
    || baselineIds.some((id) => !allIds.includes(id))
    || baselineIds.some((id) => !['fixed_dates', 'rolling', 'not_stated', 'not_checked', 'unclear']
      .includes(baseline.window_status_by_stimulus[id]))) {
    throw new PilotError('INVALID_AGENT_BASELINE');
  }
  const pageIds = stimuli.cases.filter((item) => item.record_group === 'page').map((item) => item.stimulus_id);
  const pageErrors = pageIds.filter((id) =>
    baseline.window_status_by_stimulus[id] !== goldById.get(id).expected_window_status).length;
  const allErrors = allIds.filter((id) =>
    baseline.window_status_by_stimulus[id] !== goldById.get(id).expected_window_status).length;
  return {
    error_count: pageErrors,
    exact: pageIds.length - pageErrors,
    total: pageIds.length,
    all_case_error_count: allErrors,
    all_case_exact: allIds.length - allErrors,
    all_case_total: allIds.length,
  };
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

function resultMap(results, attempts) {
  const attemptIds = validateAttempts(attempts);
  const byId = new Map();
  const commonKeys = [
    'protocol_id', 'attempt_id', 'stimulus_id', 'variant', 'outcome', 'model',
    'window_status', 'evidence_id', 'evidence', 'usage', 'estimated_usage_cost_usd',
    'client_request_ms', 'provider_model_time_ms', 'provider_model_time_note',
    'elapsed_from_run_start_ms', 'received_at', 'no_update', 'requires_human_review',
  ];
  for (const result of results) {
    const expectedKeys = result?.outcome === 'safe_error' ? [...commonKeys, 'error_code'] : commonKeys;
    if (!result || !exactKeys(result, expectedKeys)
      || typeof result.attempt_id !== 'string'
      || !attemptIds.has(result.attempt_id)
      || byId.has(result.attempt_id)
      || !['validated', 'safe_error'].includes(result.outcome)
      || result.protocol_id !== PROTOCOL_ID
      || result.model !== 'jev-1.13.0'
      || result.no_update !== true
      || result.requires_human_review !== true) {
      throw new PilotError('INVALID_RESULTS');
    }
    byId.set(result.attempt_id, result);
  }
  return byId;
}

function predictionFor(byId, stimulusId, variant = 'base') {
  const result = byId.get(stimulusId + ':' + variant);
  if (!result || result.outcome !== 'validated') return null;
  return typeof result.window_status?.choice === 'string' ? result.window_status.choice : null;
}

function observedStatusFor(byId, stimulusId, variant = 'base') {
  const choice = byId.get(stimulusId + ':' + variant)?.window_status?.choice;
  return ['fixed_dates', 'rolling', 'not_stated', 'unclear'].includes(choice) ? choice : null;
}

function observedStatusSummary(rows) {
  const scoredRows = rows.filter((row) => row.observed_status !== null);
  const exact = scoredRows.filter((row) => row.observed_exact).length;
  return {
    exact,
    scored: scoredRows.length,
    total: rows.length,
    accuracy: scoredRows.length ? exact / scoredRows.length : null,
    coverage: rows.length ? scoredRows.length / rows.length : null,
  };
}

function provenanceMatches(stimulus, result, gold) {
  if (!result || result.outcome !== 'validated') return false;
  const status = result.window_status?.choice;
  const evidenceId = result.evidence_id?.choice;
  if (['fixed_dates', 'rolling'].includes(status)) {
    const candidate = stimulus.candidate_paragraphs.find((item) => item.candidate_id === evidenceId);
    const page = candidate && stimulus.pages.find((item) => item.page_id === candidate.page_id);
    return Boolean(candidate && page
      && result.evidence?.candidate_id === candidate.candidate_id
      && result.evidence?.exact_paragraph === candidate.paragraph
      && result.evidence?.source_url === page.source_url
      && evidenceId === gold.expected_evidence_id
      && candidate.paragraph === gold.expected_exact_quote
      && page.source_url === gold.expected_source_url);
  }
  return result.evidence === null;
}

export function computeMetrics({
  stimuli,
  gold,
  results,
  attempts,
  permutationPlan,
  agentBaseline = null,
  priceConfig = null,
  priceSnapshot = null,
  runMetadata = null,
  runSummary = null,
  allowDraftGold = false,
}) {
  validateStimuli(stimuli);
  const { goldById } = requireGold(stimuli, gold, allowDraftGold);
  const baselineSummary = requireAgentBaseline(agentBaseline, stimuli, goldById);
  const byAttempt = resultMap(results, attempts);
  if (attempts.length > MAX_REQUESTS) throw new PilotError('REQUEST_CAP_REACHED');

  const pageCases = stimuli.cases.filter((item) => item.record_group === 'page');
  const challengeCases = stimuli.cases.filter((item) => item.record_group === 'challenge');
  const controls = stimuli.cases.filter((item) => item.record_group === 'not_checked_control');
  const pageRows = pageCases.map((stimulus) => {
    const goldRow = goldById.get(stimulus.stimulus_id);
    const result = byAttempt.get(stimulus.stimulus_id + ':base');
    const prediction = predictionFor(byAttempt, stimulus.stimulus_id);
    const observedStatus = observedStatusFor(byAttempt, stimulus.stimulus_id);
    return {
      stimulus_id: stimulus.stimulus_id,
      expected: goldRow.expected_window_status,
      predicted: prediction,
      exact: prediction === goldRow.expected_window_status,
      covered: Boolean(prediction && prediction !== 'unclear'),
      positive_false: goldRow.expected_window_status === 'not_stated'
        && ['fixed_dates', 'rolling'].includes(prediction),
      observed_status: observedStatus,
      observed_exact: observedStatus === goldRow.expected_window_status,
      observed_positive_false: goldRow.expected_window_status === 'not_stated'
        && ['fixed_dates', 'rolling'].includes(observedStatus),
      provenance: provenanceMatches(stimulus, result, goldRow),
    };
  });
  const challengeRows = challengeCases.map((stimulus) => {
    const goldRow = goldById.get(stimulus.stimulus_id);
    const result = byAttempt.get(stimulus.stimulus_id + ':base');
    const prediction = predictionFor(byAttempt, stimulus.stimulus_id);
    const observedStatus = observedStatusFor(byAttempt, stimulus.stimulus_id);
    return {
      stimulus_id: stimulus.stimulus_id,
      expected: goldRow.expected_window_status,
      predicted: prediction,
      exact: prediction === goldRow.expected_window_status,
      observed_status: observedStatus,
      observed_exact: observedStatus === goldRow.expected_window_status,
      observed_positive_false: goldRow.expected_window_status === 'not_stated'
        && ['fixed_dates', 'rolling'].includes(observedStatus),
      provenance: provenanceMatches(stimulus, result, goldRow),
    };
  });

  const notCheckedCorrect = controls.filter((stimulus) =>
    stimulus.call_policy === 'no_call_no_program_or_apply_page'
      && !byAttempt.has(stimulus.stimulus_id + ':base')
      && !results.some((result) => result.stimulus_id === stimulus.stimulus_id)
      && !attempts.some((attempt) => attempt.stimulus_id === stimulus.stimulus_id)).length;

  const permutationIds = permutationPlan?.stimulus_ids ?? [];
  const optionOrderPairs = permutationIds.map((id) => ({
    stimulus_id: id,
    base: predictionFor(byAttempt, id, 'base'),
    permuted: predictionFor(byAttempt, id, 'permuted'),
    observed_base: observedStatusFor(byAttempt, id, 'base'),
    observed_permuted: observedStatusFor(byAttempt, id, 'permuted'),
    observed_status_invariant: Boolean(observedStatusFor(byAttempt, id, 'base')
      && observedStatusFor(byAttempt, id, 'permuted')
      && observedStatusFor(byAttempt, id, 'base') === observedStatusFor(byAttempt, id, 'permuted')),
    invariant: Boolean(predictionFor(byAttempt, id, 'base')
      && predictionFor(byAttempt, id, 'permuted')
      && predictionFor(byAttempt, id, 'base') === predictionFor(byAttempt, id, 'permuted')),
  }));

  const responseResults = results.filter((result) => result.usage !== null);
  const requestTimes = results.map((result) => result.client_request_ms).filter(Number.isFinite);
  const inputTokens = responseResults.reduce((sum, result) => sum + result.usage.input_tokens, 0);
  const outputTokens = responseResults.reduce((sum, result) => sum + result.usage.output_tokens, 0);
  const pricesReady = typeof priceConfig?.input_usd_per_million_tokens === 'number'
    && typeof priceConfig?.output_usd_per_million_tokens === 'number';
  const unresolved = attempts.filter((attempt) =>
    !byAttempt.has(attempt.attempt_id)).map((attempt) => attempt.attempt_id);
  const costComplete = pricesReady
    && unresolved.length === 0
    && results.length === attempts.length
    && responseResults.length === results.length;
  const estimatedCost = costComplete
    ? estimateCost({ input_tokens: inputTokens, output_tokens: outputTokens }, priceConfig)
    : null;
  const failed = results.filter((result) => result.outcome === 'safe_error').length + unresolved.length;
  const naturalExact = pageRows.filter((row) => row.exact).length;
  const naturalFalsePositives = pageRows.filter((row) => row.observed_positive_false).length;
  const challengeFalsePositives = challengeRows.filter((row) => row.observed_positive_false).length;
  const allObservedNotStatedFalsePositives = naturalFalsePositives + challengeFalsePositives;
  const challengeExact = challengeRows.filter((row) => row.exact).length;
  const provenance = [...pageRows, ...challengeRows];
  const provenancePass = provenance.every((row) => {
    const expectedPositive = ['fixed_dates', 'rolling'].includes(row.expected);
    return expectedPositive ? row.provenance : row.provenance;
  });
  const baselineDelta = baselineSummary ? pageRows.length - naturalExact - baselineSummary.error_count : null;
  const criteria = {
    natural_accuracy: naturalExact >= 22,
    baseline_no_more_than_one_error_worse: baselineDelta !== null && baselineDelta <= 1,
    no_not_stated_false_positives: allObservedNotStatedFalsePositives === 0,
    no_call_controls: notCheckedCorrect === 8,
    challenge_exact: challengeExact === 8,
    provenance_exact: provenancePass,
    option_order_invariant: optionOrderPairs.length === 8 && optionOrderPairs.every((item) => item.observed_status_invariant),
  };
  return {
    protocol_id: PROTOCOL_ID,
    analysis_revision: ANALYSIS_REVISION,
    model: 'jev-1.13.0',
    review_status: gold.review_status,
    natural_page_cases: {
      exact: naturalExact,
      total: pageRows.length,
      accuracy: pageRows.length ? naturalExact / pageRows.length : null,
      coverage: pageRows.filter((row) => row.covered).length,
      abstentions_or_missing: pageRows.filter((row) => !row.covered).length,
      not_stated_false_positives: naturalFalsePositives,
      observed_status: observedStatusSummary(pageRows),
      rows: pageRows,
    },
    not_checked_controls: { correct_no_call: notCheckedCorrect, total: controls.length },
    challenge_cases: {
      exact: challengeExact,
      total: challengeRows.length,
      not_stated_false_positives: challengeFalsePositives,
      observed_status: observedStatusSummary(challengeRows),
      rows: challengeRows,
    },
    option_order: { observed_status_invariant: optionOrderPairs.filter((item) => item.observed_status_invariant).length, invariant: optionOrderPairs.filter((item) => item.invariant).length, total: optionOrderPairs.length, pairs: optionOrderPairs },
    provenance: {
      structurally_valid_and_matches_gold: provenance.filter((row) => row.provenance).length,
      positive_predictions: provenance.filter((row) => ['fixed_dates', 'rolling'].includes(row.predicted)).length,
      all_pass: provenancePass,
    },
    agent_baseline: baselineSummary
      ? { ...baselineSummary, error_delta_model_minus_baseline: baselineDelta }
      : { status: 'not_available_yet', exact: null, error_count: null, total: pageRows.length },
    attempt_accounting: {
      attempted: attempts.length,
      cap: MAX_REQUESTS,
      failed_or_unresolved: failed,
      unresolved_attempt_ids: unresolved,
      failed_result_count: results.filter((result) => result.outcome === 'safe_error').length,
    },
    price_snapshot: priceSnapshot,
    run_metadata: runMetadata,
    run_summary: runSummary,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      usage_cost_estimate_usd: estimatedCost,
      cost_basis: pricesReady
        ? 'published-price estimate from actual returned token usage; not an invoice'
        : 'price snapshot unavailable',
      cost_estimate_complete: costComplete,
      client_request_ms: {
        p50: percentile(requestTimes, 0.50),
        p95: percentile(requestTimes, 0.95),
        maximum: requestTimes.length ? Math.max(...requestTimes) : null,
      },
      provider_model_time_ms: null,
      provider_model_time_note: 'The response contract has no provider-reported model latency field.',
      total_runtime_ms: results.length
        ? Math.max(...results.map((result) => result.elapsed_from_run_start_ms ?? 0))
        : null,
    },
    human_review_time_saving_percent: null,
    integration_roi_claim: false,
    acceptance: {
      observed_not_stated_false_positives: allObservedNotStatedFalsePositives,
      criteria,
      pass: Object.values(criteria).every(Boolean),
      blocked_by_baseline: baselineSummary === null,
      human_time_gate: 'not_assessed_without_human_testers',
    },
    no_app_update: true,
  };
}
