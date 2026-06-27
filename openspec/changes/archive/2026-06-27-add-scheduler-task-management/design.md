# Design: Scheduler Task Management

## Overview

The frontend adds a new `Scheduler` top-level route with a child `SchedulerTasks` page. The page follows existing management-page patterns from `src/views/system/role/`: `PureTableBar`, `pure-table`, `addDialog`, Element Plus forms, and local page hooks.

## API

Create `src/api/scheduler.ts` with typed wrappers for the proto-defined endpoints:

- `GET /api/scheduler/tasks`
- `POST /api/scheduler/tasks`
- `PUT /api/scheduler/tasks/:id`
- `DELETE /api/scheduler/tasks/:id`

The list request maps table pagination to:

- `limit = pagination.pageSize`
- `offset = (pagination.currentPage - 1) * pagination.pageSize`

Empty `task_name` and `handler` values are omitted from the request.

## Routing

Add `scheduler = 29` to `src/router/enums.ts`.

Create `src/router/modules/scheduler.ts`:

- Parent: `/scheduler`, title `menus.pureScheduler`
- Child: `/scheduler/tasks`, title `menus.pureSchedulerTasks`

## Page Structure

`src/views/scheduler/tasks/index.vue` renders:

- Inline search form for task name and handler
- `PureTableBar` with an add button
- Paginated `pure-table`
- Operation column with edit and delete actions

The main table displays common fields only:

- id
- task_name
- cron_expr
- handler
- next_tick
- last_execution_time
- created_time
- updated_time

`extra` is intentionally not shown as a main column to keep the table readable.

## Dialog Form

`src/views/scheduler/tasks/form.vue` supports create and update with:

- task_name
- cron_expr
- handler

All fields are required. Cron expression validation remains backend-owned.

## Error Handling

List failures clear table data and show an error message.

Create, update, and delete failures keep the dialog or page state stable and show an error message. Successful mutations refresh the current list.

When deleting the last row on a non-first page, the page number moves back to the last available page before refreshing.
