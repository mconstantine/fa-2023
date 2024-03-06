declare created_id uuid;

begin

insert into budget (year, value, category_id, user_id)
select year, value, category_id, user_id
from jsonb_populate_record(null::budget, body || jsonb_build_object('user_id', owner_id))
returning id into created_id;

return (
  select to_jsonb(r.*) from (
    select
      b.*,
      (
        select to_jsonb(c.*)
        from category c
        where c.id = b.category_id
      ) as category
    from budget b
    where b.id = created_id
  ) r
);

end
