declare created_ids uuid[];

begin

with created as (
  insert into budget (year, value, category_id)
  select year, value, category_id
  from jsonb_populate_recordset(null::budget, body)
  returning id
)
select array_agg(created.id) from created into created_ids;

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
