declare result category;

begin

select * from jsonb_populate_record(null::category, body) into result;

update category
set
	name = coalesce(result.name, name),
	is_meta = coalesce(result.is_meta, is_meta),
	keywords = coalesce(result.keywords, keywords)
where id = target_id
returning * into result;

return to_jsonb(result);

end
