declare p pagination_query;
declare start_cursor uuid;
declare end_cursor uuid;
declare min_name varchar;
declare min_cursor uuid;
declare includes_min_cursor boolean := false;
declare includes_max_cursor boolean := false;
declare max_name varchar;
declare max_cursor uuid;
declare total_count integer;
declare row record;
declare result jsonb := '[]'::jsonb;

declare c cursor for
	select *
	from category
	where case
		when p.direction = 'forward' and p.target is not null
		then name > (
			select name
			from category
			where id = p.target
		)
		when p.direction = 'backward' and p.target is not null
		then name < (
			select name
			from category
			where id = p.target
		)
		else true
		end
	and case
		when search_query != ''
		then lower(name) like concat('%', lower(search_query), '%')
		else true
		end
	order by
		case when p.direction = 'backward' then name end desc,
		case when p.direction = 'forward' then name end asc
	limit coalesce(p.count, 1);

begin

select * from jsonb_populate_record(
	null::pagination_query,
	pagination_query
)
into p;

select
	count(id),
	case
		when p.direction = 'backward'
		then max(name)
		else min(name)
		end,
	case
		when p.direction = 'backward'
		then min(name)
		else max(name)
		end
from category
where case
	when search_query != ''
	then lower(name) like concat('%', lower(search_query), '%')
	else true
	end
into total_count, min_name, max_name;

select id
from category
where name = min_name
into min_cursor;

select id
from category
where name = max_name
into max_cursor;

open c;
fetch first from c into start_cursor;
fetch last from c into end_cursor;

move first from c;
move prior from c;

loop
	fetch c into row;
	exit when not found;
	select result || jsonb_build_object(
		'cursor', row.id,
		'node', to_jsonb(row)
	) into result;

	if row.id = min_cursor then
		includes_min_cursor := true;
	end if;

	if row.id = max_cursor then
		includes_max_cursor := true;
	end if;
end loop;

return jsonb_build_object(
	'page_info', jsonb_build_object(
		'total_count', total_count,
		'start_cursor', start_cursor,
		'end_cursor', end_cursor,
		'has_previous_page', not includes_min_cursor,
		'has_next_page', not includes_max_cursor
	),
	'edges', result
);
end
