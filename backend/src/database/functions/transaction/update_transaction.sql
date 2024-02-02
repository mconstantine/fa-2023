declare result transaction;

begin

select * from jsonb_populate_record(null::transaction, body) into result;

update transaction
set
	description = coalesce(result.description, description),
	value = coalesce(result.value, value),
	date = coalesce(result.date, date)
where id = target_id
returning * into result;

return to_jsonb(result);

end
