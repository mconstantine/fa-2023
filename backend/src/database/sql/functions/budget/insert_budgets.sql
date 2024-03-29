declare created_id uuid;
declare created_ids uuid[];

begin

for i in 1 .. jsonb_array_length(body)
loop
  insert into budget (year, value, category_id, user_id)
  select year, value, category_id, user_id
  from jsonb_populate_record(null::budget, body->(i - 1) || jsonb_build_object('user_id', owner_id))
  returning id into created_id;

  created_ids := array_append(created_ids, created_id);
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
    where b.id = any(created_ids)
  ) r
);

end
