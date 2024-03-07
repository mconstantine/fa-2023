declare categories_ids uuid[];

begin

select array_agg(r.*)
from jsonb_array_elements_text(filters->'categories_ids') r
into categories_ids;

return jsonb_build_object(
  'time', (
    select coalesce(json_arrayagg(r.*), '[]')
    from (
      select
        case
          when filters->>'time_range' = 'monthly'
            then extract(month from t.date)
          when filters->>'time_range' = 'weekly'
            then extract(week from t.date)
          when filters->>'time_range' = 'daily'
            then extract(doy from t.date)
          else null
        end as time,
        sum(t.value) as total
      from (
        select t.*
        from transaction t
        left join transactions_categories tc on tc.transaction_id = t.id
        left join category c on tc.category_id = c.id
        where
          t.user_id = owner_id
          and extract(year from t.date) = (filters->>'year')::integer
          and case
            when coalesce(array_length(categories_ids, 1), 0) = 0
            then true
            else c.id = any(categories_ids)
            end
        group by t.id
      ) t
      group by
        case
          when filters->>'time_range' = 'monthly'
            then extract(month from t.date)
          when filters->>'time_range' = 'weekly'
            then extract(week from t.date)
          when filters->>'time_range' = 'daily'
            then extract(doy from t.date)
          else null
        end
      order by time
    ) r
  ),
  'categories', (
    select coalesce(json_arrayagg(r.*), '[]')
    from (
      select
        c.id,
        c.name,
        c.is_meta,
        max(t.value) as max_transaction_value,
        min(t.value) as min_transaction_value,
        sum(t.value) as total
      from category s
      join transactions_categories ct on ct.category_id = s.id
      join transaction t on ct.transaction_id = t.id
      join transactions_categories tc on tc.transaction_id = t.id
      join category c on tc.category_id = c.id
      where
        s.user_id = owner_id
        and extract(year from t.date) = (filters->>'year')::integer
        and s.id = any(categories_ids)
      group by c.id
      order by total asc, is_meta asc
    ) r
  )
);

end
