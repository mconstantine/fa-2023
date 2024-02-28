create table if not exists "user"
(
    id uuid not null default gen_random_uuid(),
    name character varying(255) not null,
    email character varying(255) not null constraint user_email_unique unique,
    password text not null,
    constraint user_pkey primary key (id)
);
