declare result transaction;

begin

insert into transaction (description, value, date)
select description, value, date
from jsonb_populate_record(
  null::transaction,
  body || jsonb_build_object('value', ((body->>'value')::numeric(10, 2) * 100)::integer)
)
returning * into result;

return to_jsonb(result) || jsonb_build_object('value', round(result.value::numeric(10, 2) / 100, 2));

end
