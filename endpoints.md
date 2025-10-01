## Acq
| Method | Path | operationId |
|---|---|---|
| POST | /api/v1/acq/ops/redis/clear | acq_redis_clear_api_v1_acq_ops_redis_clear_post |
| GET | /api/v1/acq/ops/peek-idem | acq_peek_idem_api_v1_acq_ops_peek_idem_get |
| GET | /api/v1/acq/ops/list-idem | acq_list_idem_api_v1_acq_ops_list_idem_get |
| POST | /api/v1/acq/{provider} | ingest_api_v1_acq__provider__post |
| DELETE | /api/v1/acq/ops/idem | acq_delete_idem_api_v1_acq_ops_idem_delete |

## Address
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/address/ | list_address_api_v1_address__get |
| POST | /api/v1/address/ | create_address_api_v1_address__post |
| GET | /api/v1/address/with-relationships | list_address_with_relationships_api_v1_address_with_relationships_get |
| GET | /api/v1/address/{id} | read_address_api_v1_address__id__get |
| PUT | /api/v1/address/{id} | update_address_api_v1_address__id__put |
| DELETE | /api/v1/address/{id}/hard-delete | delete_address_api_v1_address__id__hard_delete_delete |

## Auth
| Method | Path | operationId |
|---|---|---|
| POST | /api/v1/auth/token | login_for_access_token_api_v1_auth_token_post |
| POST | /api/v1/auth/auth/validate-token | validate_token_api_v1_auth_auth_validate_token_post |

## Contacttype
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/contacttype/ | list_contacttype_api_v1_contacttype__get |
| POST | /api/v1/contacttype/ | create_contacttype_api_v1_contacttype__post |
| GET | /api/v1/contacttype/{id} | read_contacttype_api_v1_contacttype__id__get |
| PUT | /api/v1/contacttype/{id} | update_contacttype_api_v1_contacttype__id__put |
| DELETE | /api/v1/contacttype/{id}/hard-delete | delete_contacttype_api_v1_contacttype__id__hard_delete_delete |
| PATCH | /api/v1/contacttype/activate | batch_activate_contacttypes_api_v1_contacttype_activate_patch |
| PATCH | /api/v1/contacttype/deactivate | batch_deactivate_contacttypes_api_v1_contacttype_deactivate_patch |
| PATCH | /api/v1/contacttype/soft-delete | batch_soft_delete_contacttypes_api_v1_contacttype_soft_delete_patch |
| PATCH | /api/v1/contacttype/restore | batch_restore_contacttypes_api_v1_contacttype_restore_patch |

## Db
| Method | Path | operationId |
|---|---|---|
| GET | /api/health/db | health_db_api_health_db_get |

## Echo
| Method | Path | operationId |
|---|---|---|
| POST | /api/test/echo | echo_api_test_echo_post |

## General
| Method | Path | operationId |
|---|---|---|
| GET | /api/health | health_root_api_health_get |

## Lead
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/lead/ | list_lead_api_v1_lead__get |
| POST | /api/v1/lead/ | create_lead_api_v1_lead__post |
| GET | /api/v1/lead/with-relationships | list_lead_with_relationships_api_v1_lead_with_relationships_get |
| GET | /api/v1/lead/stats | lead_stats_api_v1_lead_stats_get |
| POST | /api/v1/lead/{lead_id}/score | score_lead_api_v1_lead__lead_id__score_post |
| POST | /api/v1/lead/score/bulk | score_leads_bulk_api_v1_lead_score_bulk_post |
| POST | /api/v1/lead/{id}/touch | touch_lead_api_v1_lead__id__touch_post |
| POST | /api/v1/lead/{id}/sla/check | sla_check_api_v1_lead__id__sla_check_post |
| POST | /api/v1/lead/sla/sweep | lead_sla_sweep_api_v1_lead_sla_sweep_post |
| GET | /api/v1/lead/{id} | read_lead_api_v1_lead__id__get |
| PUT | /api/v1/lead/{id} | update_lead_api_v1_lead__id__put |
| GET | /api/v1/lead/{id}/timeline | lead_timeline_api_v1_lead__id__timeline_get |
| DELETE | /api/v1/lead/{id}/hard-delete | delete_lead_api_v1_lead__id__hard_delete_delete |
| POST | /api/v1/lead/activate | batch_activate_leads_api_v1_lead_activate_post |
| POST | /api/v1/lead/deactivate | batch_deactivate_leads_api_v1_lead_deactivate_post |
| DELETE | /api/v1/lead/soft-delete | batch_soft_delete_leads_api_v1_lead_soft_delete_delete |
| POST | /api/v1/lead/restore | batch_restore_leads_api_v1_lead_restore_post |
| PATCH | /api/v1/lead/{id}/assign | assign_lead_api_v1_lead__id__assign_patch |
| POST | /api/v1/lead/{id}/nurture | queue_nurture_api_v1_lead__id__nurture_post |
| POST | /api/v1/lead/{record_id}/nurture/pause | pause_lead_nurture_api_v1_lead__record_id__nurture_pause_post |
| POST | /api/v1/lead/{record_id}/nurture/resume | resume_lead_nurture_api_v1_lead__record_id__nurture_resume_post |
| POST | /api/v1/lead/{record_id}/nurture/cancel | cancel_lead_nurture_api_v1_lead__record_id__nurture_cancel_post |
| POST | /api/v1/lead/{lead_id}/consent | lead_give_consent_api_v1_lead__lead_id__consent_post |
| DELETE | /api/v1/lead/{lead_id}/consent | lead_revoke_consent_api_v1_lead__lead_id__consent_delete |
| GET | /api/v1/lead/{lead_id}/nurture/pending | lead_nurture_pending_api_v1_lead__lead_id__nurture_pending_get |

## Leademailmessage
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leademailmessage/ | list_leademailmessage_api_v1_leademailmessage__get |
| POST | /api/v1/leademailmessage/ | create_leademailmessage_api_v1_leademailmessage__post |
| GET | /api/v1/leademailmessage/with-relationships | list_leademailmessage_with_relationships_api_v1_leademailmessage_with_relationships_get |
| GET | /api/v1/leademailmessage/{id} | read_leademailmessage_api_v1_leademailmessage__id__get |
| PUT | /api/v1/leademailmessage/{id} | update_leademailmessage_api_v1_leademailmessage__id__put |
| DELETE | /api/v1/leademailmessage/{id}/hard-delete | delete_leademailmessage_api_v1_leademailmessage__id__hard_delete_delete |
| PATCH | /api/v1/leademailmessage/soft-delete | batch_soft_delete_leademailmessages_api_v1_leademailmessage_soft_delete_patch |
| PATCH | /api/v1/leademailmessage/restore | batch_restore_leademailmessages_api_v1_leademailmessage_restore_patch |

## Leademailthread
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leademailthread/ | list_leademailthread_api_v1_leademailthread__get |
| POST | /api/v1/leademailthread/ | create_leademailthread_api_v1_leademailthread__post |
| GET | /api/v1/leademailthread/with-relationships | list_leademailthread_with_relationships_api_v1_leademailthread_with_relationships_get |
| GET | /api/v1/leademailthread/{id} | read_leademailthread_api_v1_leademailthread__id__get |
| PUT | /api/v1/leademailthread/{id} | update_leademailthread_api_v1_leademailthread__id__put |
| DELETE | /api/v1/leademailthread/{id}/hard-delete | delete_leademailthread_api_v1_leademailthread__id__hard_delete_delete |
| PATCH | /api/v1/leademailthread/soft-delete | batch_soft_delete_leademailthreads_api_v1_leademailthread_soft_delete_patch |
| PATCH | /api/v1/leademailthread/restore | batch_restore_leademailthreads_api_v1_leademailthread_restore_patch |

## Leadevent
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadevent/ | list_leadevent_api_v1_leadevent__get |
| POST | /api/v1/leadevent/ | create_leadevent_api_v1_leadevent__post |
| GET | /api/v1/leadevent/with-relationships | list_leadevent_with_relationships_api_v1_leadevent_with_relationships_get |
| GET | /api/v1/leadevent/{id} | read_leadevent_api_v1_leadevent__id__get |
| PUT | /api/v1/leadevent/{id} | update_leadevent_api_v1_leadevent__id__put |
| DELETE | /api/v1/leadevent/{id}/hard-delete | delete_leadevent_api_v1_leadevent__id__hard_delete_delete |

## Leadnote
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadnote/ | list_leadnote_api_v1_leadnote__get |
| POST | /api/v1/leadnote/ | create_leadnote_api_v1_leadnote__post |
| GET | /api/v1/leadnote/with-relationships | list_leadnote_with_relationships_api_v1_leadnote_with_relationships_get |
| GET | /api/v1/leadnote/{id} | read_leadnote_api_v1_leadnote__id__get |
| PUT | /api/v1/leadnote/{id} | update_leadnote_api_v1_leadnote__id__put |
| DELETE | /api/v1/leadnote/{id}/hard-delete | delete_leadnote_api_v1_leadnote__id__hard_delete_delete |
| GET | /api/v1/leadnote/lead/{lead_id} | list_for_lead_api_v1_leadnote_lead__lead_id__get |
| POST | /api/v1/leadnote/lead/{lead_id} | create_for_lead_api_v1_leadnote_lead__lead_id__post |

## Leadsmsmessage
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadsmsmessage/ | list_leadsmsmessage_api_v1_leadsmsmessage__get |
| POST | /api/v1/leadsmsmessage/ | create_leadsmsmessage_api_v1_leadsmsmessage__post |
| GET | /api/v1/leadsmsmessage/with-relationships | list_leadsmsmessage_with_relationships_api_v1_leadsmsmessage_with_relationships_get |
| GET | /api/v1/leadsmsmessage/{id} | read_leadsmsmessage_api_v1_leadsmsmessage__id__get |
| PUT | /api/v1/leadsmsmessage/{id} | update_leadsmsmessage_api_v1_leadsmsmessage__id__put |
| DELETE | /api/v1/leadsmsmessage/{id}/hard-delete | delete_leadsmsmessage_api_v1_leadsmsmessage__id__hard_delete_delete |
| PATCH | /api/v1/leadsmsmessage/soft-delete | batch_soft_delete_leadsmsmessages_api_v1_leadsmsmessage_soft_delete_patch |
| PATCH | /api/v1/leadsmsmessage/restore | batch_restore_leadsmsmessages_api_v1_leadsmsmessage_restore_patch |

## Leadsource
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadsource/ | list_leadsource_api_v1_leadsource__get |
| POST | /api/v1/leadsource/ | create_leadsource_api_v1_leadsource__post |
| GET | /api/v1/leadsource/with-relationships | list_leadsource_with_relationships_api_v1_leadsource_with_relationships_get |
| GET | /api/v1/leadsource/{id} | read_leadsource_api_v1_leadsource__id__get |
| PUT | /api/v1/leadsource/{id} | update_leadsource_api_v1_leadsource__id__put |
| DELETE | /api/v1/leadsource/{id}/hard-delete | delete_leadsource_api_v1_leadsource__id__hard_delete_delete |

## Leadstatus
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadstatus/ | list_leadstatus_api_v1_leadstatus__get |
| POST | /api/v1/leadstatus/ | create_leadstatus_api_v1_leadstatus__post |
| GET | /api/v1/leadstatus/with-relationships | list_leadstatus_with_relationships_api_v1_leadstatus_with_relationships_get |
| GET | /api/v1/leadstatus/{id} | read_leadstatus_api_v1_leadstatus__id__get |
| PUT | /api/v1/leadstatus/{id} | update_leadstatus_api_v1_leadstatus__id__put |
| DELETE | /api/v1/leadstatus/{id}/hard-delete | delete_leadstatus_api_v1_leadstatus__id__hard_delete_delete |

## Leadstatushistory
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/leadstatushistory/ | list_leadstatushistory_api_v1_leadstatushistory__get |
| POST | /api/v1/leadstatushistory/ | create_leadstatushistory_api_v1_leadstatushistory__post |
| GET | /api/v1/leadstatushistory/with-relationships | list_leadstatushistory_with_relationships_api_v1_leadstatushistory_with_relationships_get |
| GET | /api/v1/leadstatushistory/{id} | read_leadstatushistory_api_v1_leadstatushistory__id__get |
| PUT | /api/v1/leadstatushistory/{id} | update_leadstatushistory_api_v1_leadstatushistory__id__put |
| DELETE | /api/v1/leadstatushistory/{id}/hard-delete | delete_leadstatushistory_api_v1_leadstatushistory__id__hard_delete_delete |

## Nurture
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/nurture/sequence | list_sequences_api_v1_nurture_sequence_get |
| POST | /api/v1/nurture/sequence | create_sequence_api_v1_nurture_sequence_post |
| GET | /api/v1/nurture/sequence/{sequence_id} | get_sequence_api_v1_nurture_sequence__sequence_id__get |
| PATCH | /api/v1/nurture/sequence/{sequence_id} | patch_sequence_api_v1_nurture_sequence__sequence_id__patch |
| DELETE | /api/v1/nurture/sequence/{sequence_id} | delete_sequence_api_v1_nurture_sequence__sequence_id__delete |
| GET | /api/v1/nurture/sequence/{sequence_id}/steps | get_sequence_steps_api_v1_nurture_sequence__sequence_id__steps_get |
| POST | /api/v1/nurture/sequence/{sequence_id}/steps | add_sequence_step_api_v1_nurture_sequence__sequence_id__steps_post |
| DELETE | /api/v1/nurture/sequence/{sequence_id}/steps/{step_id} | delete_sequence_step_api_v1_nurture_sequence__sequence_id__steps__step_id__delete |
| PATCH | /api/v1/nurture/sequence/{sequence_id}/steps/{step_order} | update_sequence_step_api_v1_nurture_sequence__sequence_id__steps__step_order__patch |
| POST | /api/v1/nurture/sequence/{sequence_id}/simulate | simulate_sequence_api_v1_nurture_sequence__sequence_id__simulate_post |
| PATCH | /api/v1/nurture/sequence/{sequence_id}/steps/{step_order}/reorder | reorder_sequence_step_api_v1_nurture_sequence__sequence_id__steps__step_order__reorder_patch |
| POST | /api/v1/nurture/ops/pause/{lead_id} | pause_lead_api_v1_nurture_ops_pause__lead_id__post |
| POST | /api/v1/nurture/ops/cancel/{lead_id} | cancel_lead_api_v1_nurture_ops_cancel__lead_id__post |
| POST | /api/v1/nurture/ops/resume/{lead_id} | resume_lead_api_v1_nurture_ops_resume__lead_id__post |
| GET | /api/v1/nurture/ops/queue/metrics | queue_metrics_api_v1_nurture_ops_queue_metrics_get |
| GET | /api/v1/nurture/ops/dlq | dlq_list_api_v1_nurture_ops_dlq_get |
| POST | /api/v1/nurture/ops/dlq/{corr_id}/retry | dlq_retry_api_v1_nurture_ops_dlq__corr_id__retry_post |
| POST | /api/v1/nurture/ops/dlq/retry-all | dlq_retry_all_api_v1_nurture_ops_dlq_retry_all_post |
| GET | /api/v1/nurture/ops/queue/peek | peek_queue_api_v1_nurture_ops_queue_peek_get |
| POST | /api/v1/nurture/ops/redis/clear | redis_clear_api_v1_nurture_ops_redis_clear_post |

## Ops
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/ops/health/db | health_db_api_v1_ops_health_db_get |
| GET | /api/v1/ops/health/redis | health_redis_api_v1_ops_health_redis_get |

## Redis
| Method | Path | operationId |
|---|---|---|
| GET | /api/health/redis | redis_health_api_health_redis_get |

## Role
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/role/ | list_role_api_v1_role__get |
| POST | /api/v1/role/ | create_role_api_v1_role__post |
| GET | /api/v1/role/with-relationships | list_role_with_relationships_api_v1_role_with_relationships_get |
| GET | /api/v1/role/{id} | read_role_api_v1_role__id__get |
| PUT | /api/v1/role/{id} | update_role_api_v1_role__id__put |
| DELETE | /api/v1/role/{id}/hard-delete | delete_role_api_v1_role__id__hard_delete_delete |
| PATCH | /api/v1/role/activate | batch_activate_roles_api_v1_role_activate_patch |
| PATCH | /api/v1/role/deactivate | batch_deactivate_roles_api_v1_role_deactivate_patch |
| PATCH | /api/v1/role/soft-delete | batch_soft_delete_roles_api_v1_role_soft_delete_patch |
| PATCH | /api/v1/role/restore | batch_restore_roles_api_v1_role_restore_patch |

## Send
| Method | Path | operationId |
|---|---|---|
| POST | /api/v1/send/sms | send_sms_endpoint_api_v1_send_sms_post |

## Test
| Method | Path | operationId |
|---|---|---|
| POST | /api/v1/test/email | send_email_api_api_v1_test_email_post |

## User
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/user/ | list_user_api_v1_user__get |
| POST | /api/v1/user/ | create_user_api_v1_user__post |
| GET | /api/v1/user/with-relationships | list_user_with_relationships_api_v1_user_with_relationships_get |
| GET | /api/v1/user/{id} | read_user_api_v1_user__id__get |
| PUT | /api/v1/user/{id} | update_user_api_v1_user__id__put |
| DELETE | /api/v1/user/{id}/hard-delete | delete_user_api_v1_user__id__hard_delete_delete |
| PATCH | /api/v1/user/activate | batch_activate_users_api_v1_user_activate_patch |
| PATCH | /api/v1/user/deactivate | batch_deactivate_users_api_v1_user_deactivate_patch |
| PATCH | /api/v1/user/soft-delete | batch_soft_delete_users_api_v1_user_soft_delete_patch |
| PATCH | /api/v1/user/restore | batch_restore_users_api_v1_user_restore_patch |

## Usercontact
| Method | Path | operationId |
|---|---|---|
| GET | /api/v1/usercontact/ | list_usercontact_api_v1_usercontact__get |
| POST | /api/v1/usercontact/ | create_usercontact_api_v1_usercontact__post |
| GET | /api/v1/usercontact/with-relationships | list_usercontact_with_relationships_api_v1_usercontact_with_relationships_get |
| GET | /api/v1/usercontact/{id} | read_usercontact_api_v1_usercontact__id__get |
| PUT | /api/v1/usercontact/{id} | update_usercontact_api_v1_usercontact__id__put |
| DELETE | /api/v1/usercontact/{id}/hard-delete | delete_usercontact_api_v1_usercontact__id__hard_delete_delete |

## Webhooks
| Method | Path | operationId |
|---|---|---|
| POST | /api/v1/webhooks/lead | inbound_lead_api_v1_webhooks_lead_post |

