begin

return (
  select coalesce(json_arrayagg(r.*), '[]'::json) from (
    select
      b.*,
      (
        select to_jsonb(c.*)
        from category c
        where
          c.id = b.category_id
      ) as category
    from budget b
    where
      b.year = target_year
      and user_id = owner_id
  ) r
);

end
