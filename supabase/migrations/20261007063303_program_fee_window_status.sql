-- Why a program's fee or application window is (or is not) known, so an empty value is no longer
-- ambiguous. us-pilot-01: 29 of 44 programs had no fee and 26 no window, for different reasons
-- (salaried fellowships, prices on request, rolling admissions, pages never read).
-- Additive and nullable: null means not yet classified. Rollback: drop both columns, then both types.

create type fee_status as enum ('stated', 'free', 'paid_position', 'on_request', 'not_stated', 'not_checked');
create type window_status as enum ('fixed_dates', 'rolling', 'not_stated', 'not_checked');

alter table programs add column fee_status fee_status, add column window_status window_status;

comment on column programs.fee_status is
  'stated: a fee is given; free: no charge stated; paid_position: salaried/stipended post; on_request: price after sign-up or quote; not_stated: program pages read, no fee given; not_checked: no program, fees or apply page was read';
comment on column programs.window_status is
  'fixed_dates: deadlines or intake dates given; rolling: applications any time or monthly starts; not_stated: program pages read, no timing given; not_checked: no program or apply page was read';
