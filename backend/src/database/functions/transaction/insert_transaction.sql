declare created_id uuid;

begin

insert into transaction (description, value, date)
select description, value, date
from jsonb_populate_record(null::transaction, body)
returning id into created_id;

insert into transactions_categories (transaction_id, category_id)
select created_id, category_id::uuid
from jsonb_array_elements_text((body->'categoriesIds')) as category_id;

return (
  select to_jsonb(r.*) from (
    select
      t.*,
      coalesce(
        (
          select array_agg(c.*)
          from category c
          where c.id in (
            select tc.category_id
            from transactions_categories tc
            where tc.transaction_id = created_id
          )
        ),
        '{}'::category[]
      ) as categories
    from transaction t
    where t.id = created_id
  ) r
);

end
