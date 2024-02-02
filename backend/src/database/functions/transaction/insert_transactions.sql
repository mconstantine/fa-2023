declare result jsonb;

begin

create temp table tmp (encoded jsonb) on commit drop;

with inserted as (
  insert into transaction (description, value, date)
  select description, value, date
  from jsonb_populate_recordset(null::transaction, body)
  returning *
)
insert into tmp select jsonb_agg(json_build_object(
  'id', id,
  'description', description,
  'value', value,
  'date', date
)) from inserted;

select encoded from tmp limit 1 into result;
return result;

end
