declare update transaction;
declare updated_ids uuid[];
declare result jsonb;

begin

select * from jsonb_populate_record(null::transaction, body) into update;

with updated as (
  update transaction
  set
    description = coalesce(update.description, description),
    value = coalesce(update.value, value),
    date = coalesce(update.date, date)
  where id = any (ids) and user_id = owner_id
  returning id
)
select array_agg(updated.id) from updated into updated_ids;

for i in 1 .. array_upper(updated_ids, 1)
loop
  if jsonb_array_length((body->>'categories_ids')::jsonb) > 0 then
    if body->>'categories_mode' = 'replace' then
      delete from transactions_categories where transaction_id = updated_ids[i];
    end if;

    insert into transactions_categories (transaction_id, category_id)
    select updated_ids[i], category_id::uuid
    from jsonb_array_elements_text((body->>'categories_ids')::jsonb) as category_id;
  end if;
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
    where id = any (updated_ids)
  ) r
);

end
