begin

return (
  select coalesce(json_arrayagg(r.*), '[]') from(
    select
      extract('month' from t.date) as month,
      sum(
        case
          when t.value > 0
          then t.value
          else 0
        end
      ) as income,
      sum(
        case
          when t.value < 0
          then t.value
          else 0
        end
      ) as outcome,
      sum(t.value) as total
    from transaction t
    where
      t.user_id = owner_id
      and extract('year' from t.date) = year
    group by extract('month' from t.date)
    order by month
  ) r
);

end
