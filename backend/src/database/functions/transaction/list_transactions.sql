declare p pagination_query;
declare f list_transactions_filters;
declare start_cursor uuid;
declare end_cursor uuid;
declare min_date date;
declare min_cursor uuid;
declare includes_min_cursor boolean := false;
declare includes_max_cursor boolean := false;
declare max_date date;
declare max_cursor uuid;
declare total_count integer;
declare row record;
declare result jsonb := '[]'::jsonb;

declare c cursor for
	select
		t.*,
		coalesce(
			(
				select array_agg(c.*)
				from category c
				where
					c.id in (
						select tc.category_id
						from transactions_categories tc
						where tc.transaction_id = t.id
					)
			),
			'{}'::category[]
		) as categories
	from transaction t
	left join transactions_categories tc on tc.transaction_id = t.id
	where
		case
			when p.direction = 'forward' and p.target is not null
			then t.date < (
				select date
				from transaction
				where id = p.target
			)
			when p.direction = 'backward' and p.target is not null
			then t.date > (
				select date
				from transaction
				where id = p.target
			)
			else true
			end
		and case
			when f.subject = 'description' and f.search_query != ''
			then lower(description) like concat('%', lower(f.search_query), '%')
			when f.subject = 'value'
			then value >= f.min and value <= f.max
			else true
			end
		and case
			when f.categories = 'all'
			then true
			when f.categories = 'uncategorized'
			then tc.category_id is null
			when f.categories = 'specific'
			then tc.category_id = any(f.categories_ids)
			else false
			end
		and t.date >= f.date_since
		and t.date <= f.date_until
	group by t.id
	order by
		case when p.direction = 'forward' then t.date end desc,
		case when p.direction = 'backward' then t.date end asc
	limit p.count;

begin

select * from jsonb_populate_record(
	null::pagination_query,
	pagination_query
)
into p;

select * from jsonb_populate_record(
	null::list_transactions_filters,
	filters
)
into f;

select
	count(r.id),
	case
		when p.direction = 'backward'
		then min(r.date)
		else max(r.date)
		end,
	case
		when p.direction = 'backward'
		then max(r.date)
		else min(r.date)
		end
from (
	select t.id, t.date
	from transaction t
	left join transactions_categories tc on tc.transaction_id = t.id
	where
		case
			when f.subject = 'description' and f.search_query != ''
			then lower(t.description) like concat('%', lower(f.search_query), '%')
			when f.subject = 'value'
			then t.value >= f.min and t.value <= f.max
			else true
			end
		and case
			when f.categories = 'all'
			then true
			when f.categories = 'uncategorized'
			then tc.category_id is null
			when f.categories = 'specific'
			then tc.category_id = any(f.categories_ids)
			else false
			end
		and date >= f.date_since
		and date <= f.date_until
	group by t.id
) r
into total_count, min_date, max_date;

select id
from transaction
where date = min_date
into min_cursor;

select id
from transaction
where date = max_date
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
		'has_previous_page', total_count > 0 and not includes_min_cursor,
		'has_next_page', total_count > 0 and not includes_max_cursor
	),
	'edges', result
);
end
