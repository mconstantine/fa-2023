begin

return (
  select json_arrayagg(r.*) from(
    select
      c.id as category_id,
      c.name as category_name,
      sum(t.value) as transactions_total
    from transaction t
    left join transactions_categories tc on tc.transaction_id = t.id
    left join category c on tc.category_id = c.id
    where
      (c.id is null or c.is_meta = false)
      and extract('year' from t.date) = year
    group by c.id
    order by c.name
  ) r
);

end
