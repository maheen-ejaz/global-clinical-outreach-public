-- Make the prospect schema country-agnostic (US, UK, Australia, New Zealand, ...).
-- organizations gains a required ISO 3166-1 alpha-2 country code; US-specific names become neutral.

alter table organizations add column country char(2) not null check (country ~ '^[A-Z]{2}$');
alter table organizations rename column state to region;
alter table organizations rename column zip to postal_code;
create index organizations_country_idx on organizations (country);

alter type provider_type rename value 'private_usce' to 'placement_company';

-- Licensing exams differ by country (USMLE, PLAB, AMC, NZREX, MCCQE...).
alter table programs rename column usmle_min to exam_requirements;

comment on column organizations.country is 'ISO 3166-1 alpha-2 code, e.g. US, GB, AU, NZ';
comment on column organizations.region is 'State, county, province or territory';
