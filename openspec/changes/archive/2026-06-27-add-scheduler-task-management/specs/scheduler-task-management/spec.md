# scheduler-task-management Specification

## Purpose

Define the frontend menu, listing, filtering, pagination, and CRUD behavior for platform scheduled task management.

## Requirements

### Requirement: Scheduler menu entry

The system SHALL provide a top-level scheduler menu entry for scheduled task management.

#### Scenario: Scheduler appears as top-level menu

- **WHEN** the application loads available static routes
- **THEN** the navigation menu MUST include a top-level scheduler entry titled `定时任务`

#### Scenario: Task management page is reachable

- **WHEN** the user opens the scheduler menu
- **THEN** the user MUST be able to navigate to the task management page under scheduler

### Requirement: List scheduled tasks

The system SHALL fetch scheduled tasks from `GET /api/scheduler/tasks`.

#### Scenario: Default list request

- **WHEN** the user enters the task management page
- **THEN** the frontend MUST call `/api/scheduler/tasks` with `limit` and `offset`

#### Scenario: Render common fields

- **WHEN** scheduled tasks are returned
- **THEN** the table MUST show `id`, `task_name`, `cron_expr`, `handler`, `next_tick`, `last_execution_time`, `created_time`, and `updated_time`
- **AND** `extra` MUST NOT be rendered as a main table column

### Requirement: Filter scheduled tasks

The system SHALL support filtering by task name and handler.

#### Scenario: Filter by task name

- **WHEN** the user enters a task name and searches
- **THEN** the frontend MUST send `task_name` as a query parameter

#### Scenario: Filter by handler

- **WHEN** the user enters a handler and searches
- **THEN** the frontend MUST send `handler` as a query parameter

### Requirement: Paginate scheduled tasks

The system SHALL map table pagination to backend `limit` and `offset` query parameters.

#### Scenario: Page changes

- **WHEN** the user changes the current page
- **THEN** the frontend MUST request the corresponding `offset`

#### Scenario: Page size changes

- **WHEN** the user changes the page size
- **THEN** the frontend MUST update `limit` and reset to the first page

### Requirement: Manage scheduled tasks

The system SHALL support creating, updating, and deleting scheduled tasks.

#### Scenario: Create scheduled task

- **WHEN** the user submits a valid create form
- **THEN** the frontend MUST call `POST /api/scheduler/tasks` with `task_name`, `cron_expr`, and `handler`

#### Scenario: Update scheduled task

- **WHEN** the user submits a valid edit form
- **THEN** the frontend MUST call `PUT /api/scheduler/tasks/:id` with `task_name`, `cron_expr`, and `handler`

#### Scenario: Delete scheduled task

- **WHEN** the user confirms deletion
- **THEN** the frontend MUST call `DELETE /api/scheduler/tasks/:id`
- **AND** refresh the scheduled task list after success
