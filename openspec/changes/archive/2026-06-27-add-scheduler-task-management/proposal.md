# Proposal: Add Scheduler Task Management

## What

Add a top-level scheduler menu and a task management page for platform scheduled tasks.

The page will support:

- Listing scheduled tasks from `GET /api/scheduler/tasks`
- Filtering by `task_name` and `handler`
- Pagination via `limit` and `offset`
- Creating tasks with `task_name`, `cron_expr`, and `handler`
- Updating tasks with `task_name`, `cron_expr`, and `handler`
- Deleting tasks by id

## Why

The platform already exposes scheduled task APIs in `/Users/bytedance/src/ecom_backend/idl/ecom.proto`, but the admin frontend has no entry to view or manage registered scheduled tasks.

## Non-goals

- Do not expose `extra` as an editable field because the create/update proto messages do not define it.
- Do not add unsupported filters beyond `task_name` and `handler`.
- Do not implement client-side Cron expression parsing beyond required-field validation.
