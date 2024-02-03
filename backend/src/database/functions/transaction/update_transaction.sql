declare update transaction;
declare updated_id uuid;

begin

select * from jsonb_populate_record(null::transaction, body) into update;

update transaction
set
	description = coalesce(update.description, description),
	value = coalesce(update.value, value),
	date = coalesce(update.date, date)
where id = target_id
returning id into updated_id;

if jsonb_array_length(body->'categoriesIds') > 0 then
	delete from transactions_categories where transaction_id = updated_id;

	insert into transactions_categories (transaction_id, category_id)
	select updated_id, category_id::uuid
	from jsonb_array_elements_text((body->'categoriesIds')) as category_id;
end if;

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
            where tc.transaction_id = updated_id
          )
        ),
        '{}'::category[]
      ) as categories
		from transaction t
		where t.id = updated_id
	) r
);

end
