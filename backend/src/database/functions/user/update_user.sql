declare result "user";

begin

select * from jsonb_populate_record(null::"user", body) into result;

update "user"
set
	name = coalesce(result.name, name),
	email = coalesce(result.email, email),
  password = case
    when result.password is null
    then password
    else crypt(result.password, gen_salt('bf'))
    end
where id = target_id
returning * into result;

return to_jsonb(result);

end
