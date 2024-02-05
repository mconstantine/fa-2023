declare update budget;
declare updated_id uuid;

begin

select * from jsonb_populate_record(null::budget, body) into update;

update budget
set
	year = coalesce(update.year, year),
	value = coalesce(update.value, value),
	category_id = coalesce(update.category_id, category_id)
where id = target_id
returning id into updated_id;

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
    where b.id = updated_id
  ) r
);

end
