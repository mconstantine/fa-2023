begin

return (
  select to_jsonb(u.*)
  from "user" u
  where
    u.email = target_email
    and password = crypt(target_password, password)
);

end
