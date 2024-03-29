declare result category;
begin

delete from category
where id = target_id and user_id = owner_id
returning * into result;
return to_jsonb(result);

end
