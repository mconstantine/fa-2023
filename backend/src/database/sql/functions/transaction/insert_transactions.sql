declare created_ids uuid[];
declare created_id uuid;

begin

for i in 1 .. jsonb_array_length(body)
loop
  insert into transaction (description, value, date, user_id)
  select description, value, date, user_id
  from jsonb_populate_record(null::transaction, body->(i - 1) || jsonb_build_object('user_id', owner_id))
  returning id into created_id;

  created_ids := array_append(created_ids, created_id);
end loop;

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
