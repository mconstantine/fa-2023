create table if not exists budget
(
    id uuid not null default gen_random_uuid(),
    year integer not null,
    value integer not null,
    category_id uuid,
    constraint budget_pkey primary key (id),
    constraint category_id_year_unique unique nulls not distinct (category_id, year),
    constraint category_fkey foreign key (category_id)
        references category (id) match simple
        on update no action
        on delete cascade
        not valid
);
