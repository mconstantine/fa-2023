declare created_ids uuid[];
declare created_id uuid;

begin

with created as (
  insert into transaction (description, value, date)
  select description, value, date
  from jsonb_populate_recordset(null::transaction, body)
  returning id
)
select array_agg(created.id) from created into created_ids;

for i in 1 .. array_upper(created_ids, 1)
loop
  insert into transactions_categories (transaction_id, category_id)
  select created_ids[i], category_id::uuid
  from jsonb_array_elements_text((body->(i - 1)->>'categories_ids')::jsonb) as category_id;
end loop;

return (
  select json_arrayagg(r.*) from (
    select t.*, coalesce(
      (
        select array_agg(c.*)
        from category c
        where c.id in (
          select tc.category_id
          from transactions_categories tc
          where tc.transaction_id = t.id
        )
      ),
      '{}'::category[]
    ) as categories
    from transaction t
    where id = any (created_ids)
  ) r
);

end
