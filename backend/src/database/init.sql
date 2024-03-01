-- custom types
drop type if exists
	pagination_query,
	pagination_query_direction,
	list_transactions_filters_subject,
	list_transactions_filters_categories,
	list_transactions_filters;

create type pagination_query_direction as enum ('forward', 'backward');

create type pagination_query as
(
	direction pagination_query_direction,
	count integer,
	target uuid
);

create type list_transactions_filters_subject as enum('description', 'value', 'none');
create type list_transactions_filters_categories as enum ('all', 'uncategorized', 'specific');

create type list_transactions_filters as (
	subject list_transactions_filters_subject,
	search_query character varying,
	max integer,
	min integer,
	categories list_transactions_filters_categories,
	categories_ids uuid[],
	date_since date,
	date_until date
);

-- extensions
create extension if not exists pgcrypto;
