declare update budget[];
declare updated_id uuid;
declare updated_ids uuid[] := '{}'::uuid[];

begin

select array_agg(r.*) from jsonb_populate_recordset(null::budget, body) r into update;

for i in 1 .. array_upper(update, 1)
loop
  update budget set value = coalesce(update[i].value, value)
  where id = update[i].id
  returning id into updated_id;

  updated_ids := array_append(updated_ids, updated_id);
end loop;

return (
  select json_arrayagg(r.*) from (
    select
      b.*,
      (
        select to_jsonb(c.*)
        from category c
        where c.id = b.category_id
      ) as category
    from budget b
    where b.id = any(updated_ids)
  ) r
);

end
