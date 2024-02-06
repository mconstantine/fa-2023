begin

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
    where b.year = target_year
  ) r
);

end
