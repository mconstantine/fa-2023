create table if not exists budget
(
    id uuid not null,
    year integer not null,
    value integer not null,
    category_id uuid,
    constraint budget_pkey primary key (id),
    constraint category_id_year_unique unique (category_id, year),
    constraint category_fkey foreign key (category_id)
        references category (id) match simple
        on update no action
        on delete cascade
        not valid
);
