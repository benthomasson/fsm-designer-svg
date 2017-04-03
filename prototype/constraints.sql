alter table prototype_messagetype add constraint prototype_messagetype_name_unique unique (name);
alter table prototype_state add constraint prototype_state_fsm_id_unique unique (finite_state_machine_id, id);

