create table project (
    id bigint auto_increment primary key,
    code varchar(50) not null,
    name varchar(100) not null,
    status varchar(20) not null,
    lottery_date date null,
    data_hash varchar(64) null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint uk_project_code unique (code)
);

create table household (
    id bigint auto_increment primary key,
    project_id bigint not null,
    participant_no varchar(50) not null,
    head_name varchar(100) not null,
    id_card_no varchar(32) not null,
    phone_no varchar(20) not null,
    family_size int not null,
    qualification_status varchar(20) not null,
    lottery_status varchar(20) not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_household_project foreign key (project_id) references project (id),
    constraint uk_household_project_participant unique (project_id, participant_no)
);

create index idx_household_project_status on household (project_id, qualification_status);

create table housing_unit (
    id bigint auto_increment primary key,
    project_id bigint not null,
    unit_code varchar(50) not null,
    building_no varchar(50) not null,
    room_no varchar(50) not null,
    house_type varchar(20) not null,
    status varchar(20) not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_housing_unit_project foreign key (project_id) references project (id),
    constraint uk_housing_unit_project_code unique (project_id, unit_code)
);

create index idx_housing_unit_project_type_status on housing_unit (project_id, house_type, status);

create table wish (
    id bigint auto_increment primary key,
    project_id bigint not null,
    household_id bigint not null,
    priority int not null,
    house_type varchar(20) not null,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_wish_project foreign key (project_id) references project (id),
    constraint fk_wish_household foreign key (household_id) references household (id),
    constraint uk_wish_household_priority unique (household_id, priority)
);

create index idx_wish_project_active on wish (project_id, is_active);

create table lottery_round (
    id bigint auto_increment primary key,
    project_id bigint not null,
    round_code varchar(10) not null,
    seed varchar(128) not null,
    candidate_count int not null,
    winner_count int not null,
    executed_at timestamp not null default current_timestamp,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_lottery_round_project foreign key (project_id) references project (id)
);

create index idx_lottery_round_project_code on lottery_round (project_id, round_code);

create table lottery_result (
    id bigint auto_increment primary key,
    project_id bigint not null,
    round_id bigint not null,
    household_id bigint not null,
    assigned_unit_id bigint null,
    result varchar(20) not null,
    candidate_order int not null,
    published boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_lottery_result_project foreign key (project_id) references project (id),
    constraint fk_lottery_result_round foreign key (round_id) references lottery_round (id),
    constraint fk_lottery_result_household foreign key (household_id) references household (id),
    constraint fk_lottery_result_unit foreign key (assigned_unit_id) references housing_unit (id)
);

create index idx_lottery_result_round_result on lottery_result (round_id, result);
create index idx_lottery_result_project_household on lottery_result (project_id, household_id);

create table audit_log (
    id bigint auto_increment primary key,
    project_id bigint not null,
    action varchar(50) not null,
    actor varchar(100) not null,
    payload_json text not null,
    created_at timestamp not null default current_timestamp,
    constraint fk_audit_log_project foreign key (project_id) references project (id)
);

create index idx_audit_log_project_action on audit_log (project_id, action);
