drop type if exists pagination_query, pagination_query_direction;

create type pagination_query_direction as enum ('forward', 'backward');

create type pagination_query as
(
	direction pagination_query_direction,
	count integer,
	target uuid
);
