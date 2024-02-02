declare record transaction;
declare result jsonb;

begin

select * from jsonb_populate_record(null::transaction, body) into record;
create temp table tmp (encoded jsonb) on commit drop;

with updated as (
  update transaction
  set
    description = coalesce(record.description, description),
    value = coalesce(record.value, value),
    date = coalesce(record.date, date)
  where id = any (ids)
  returning *
)
insert into tmp select jsonb_agg(json_build_object(
  'id', id,
  'description', description,
  'value', value,
  'date', date
)) from updated;

select encoded from tmp limit 1 into result;
return result;

end
