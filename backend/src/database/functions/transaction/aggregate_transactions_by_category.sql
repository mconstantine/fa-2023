begin

return (
  select coalesce(json_arrayagg(r.*), '[]') from(
    select
      c.id as category_id,
      c.name as category_name,
      c.is_projectable as category_is_projectable,
      sum(t.value) as transactions_total
    from transaction t
    left join transactions_categories tc on tc.transaction_id = t.id
    left join category c on tc.category_id = c.id
    where
      t.user_id = owner_id
      and (c.id is null or c.is_meta = false)
      and extract('year' from t.date) = year
    group by c.id
    order by c.name
  ) r
);

end
