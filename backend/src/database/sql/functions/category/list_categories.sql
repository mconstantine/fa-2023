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
	where user_id = owner_id
	and case
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
	and case
		when is_meta_filter is null
		then true
		else is_meta = is_meta_filter
		end
	order by
		case when p.direction = 'backward' then name end desc,
		case when p.direction = 'forward' then name end asc
	limit p.count;

begin

select * from jsonb_populate_record(
	null::pagination_query,
	pagination_query
)
into p;

select
	count(id),
	min(name),
	max(name)
from category
where
	user_id = owner_id
	and case
		when search_query != ''
		then lower(name) like concat('%', lower(search_query), '%')
		else true
		end
	and case
		when is_meta_filter is null
		then true
		else is_meta = is_meta_filter
		end
into total_count, min_name, max_name;

select id
from category
where name = min_name and user_id = owner_id
into min_cursor;

select id
from category
where name = max_name and user_id = owner_id
into max_cursor;

open c;

if p.direction = 'forward' then
	fetch first from c into start_cursor;
	fetch last from c into end_cursor;
else
	fetch last from c into start_cursor;
	fetch first from c into end_cursor;
end if;


move first from c;
move prior from c;

loop
	fetch c into row;
	exit when not found;
	select (
		case
			when p.direction = 'forward'
			then result || jsonb_build_object(
				'cursor', row.id,
				'node', to_jsonb(row)
			)
			else jsonb_build_object(
				'cursor', row.id,
				'node', to_jsonb(row)
			) || result
			end
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
		'has_previous_page', total_count > 0 and not includes_min_cursor,
		'has_next_page', total_count > 0 and not includes_max_cursor
	),
	'edges', result
);
end
