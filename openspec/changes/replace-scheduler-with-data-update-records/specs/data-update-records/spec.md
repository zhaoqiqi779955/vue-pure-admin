## ADDED Requirements

### Requirement: Data update records navigation

The system SHALL expose the existing scheduler route as a data update records entry while preserving its current route path.

#### Scenario: Data update records menu appears

- **WHEN** the application loads static routes
- **THEN** the navigation menu MUST show `数据更新记录` instead of `定时任务`

#### Scenario: Existing route remains reachable

- **WHEN** the user opens `/scheduler/tasks`
- **THEN** the data update records page MUST be rendered

### Requirement: Query data update records

The system SHALL fetch data update runs from `GET /api/dashboard/daily/updates` and SHALL map table pagination to `limit` and `offset`.

#### Scenario: Default records request

- **WHEN** the user enters the data update records page
- **THEN** the frontend MUST request `/api/dashboard/daily/updates` with the current page `limit` and `offset`

#### Scenario: Paginate records

- **WHEN** the user changes page or page size
- **THEN** the frontend MUST request the matching `offset` and `limit`
- **AND** changing the page size MUST reset the current page to one

### Requirement: Filter data update records

The system SHALL support filtering update runs by data type, trigger source, status, and inclusive target-date range using only filters supported by the backend contract.

Supported data types SHALL include `core_etf`, `market_core`, and `zhongxin_future`.

#### Scenario: Filter by type and status

- **WHEN** the user selects a data type or execution status and searches
- **THEN** the frontend MUST send the selected `data_type` or `status` query parameter

#### Scenario: Filter by trigger source

- **WHEN** the user selects API or scheduler as the trigger source and searches
- **THEN** the frontend MUST send the selected `trigger_source` query parameter

#### Scenario: Filter by target-date range

- **WHEN** the user selects a complete target-date range and searches
- **THEN** the frontend MUST send `target_start_date` and `target_end_date` in `YYYY-MM-DD` form

#### Scenario: Reset filters

- **WHEN** the user resets the search form
- **THEN** all optional filters MUST be cleared and the first page MUST be loaded

### Requirement: Render update outcomes

The system SHALL render each returned run's identity, job name, trigger source, data type, target date range, status, aggregate progress, optional error summary, submitted time, start time, and finish time.

#### Scenario: Render a successful run

- **WHEN** a run has status `success`
- **THEN** the table MUST show a success status tag, complete aggregate progress, an empty error placeholder, and execution times

#### Scenario: Render a partially successful run

- **WHEN** a run has status `partial_success` and an aggregated error summary
- **THEN** the table MUST show a partial-success status tag, success/failed target counts, and make the complete error summary available through a tooltip

#### Scenario: Render a failed run

- **WHEN** a run has status `failed` and an error summary
- **THEN** the table MUST show a failure status tag and make the complete error summary available without expanding the main table layout

#### Scenario: Render a running run

- **WHEN** a run has status `running` and `finished_at` is null
- **THEN** the table MUST show a running status tag, current completed/total progress, and an empty-value placeholder for the finish time

### Requirement: Submit data update run

The system SHALL allow the user to submit an asynchronous data update run through `POST /api/dashboard/daily/updates` with a supported data type and an inclusive target-date range.

Supported manual-submission data types SHALL include `core_etf`, `market_core`, and `zhongxin_future`.

#### Scenario: Open manual submission dialog

- **WHEN** the user clicks the submit update task button
- **THEN** the frontend MUST show a form for `data_type` and a required target-date range

#### Scenario: Reject an invalid target range

- **WHEN** the selected range ends in the future or contains more than 366 natural days
- **THEN** the frontend MUST prevent submission and display a validation message

#### Scenario: Submit a valid target range

- **WHEN** the user submits a valid data type and target-date range
- **THEN** the frontend MUST call `POST /api/dashboard/daily/updates` with `data_type`, `start_date`, and `end_date`
- **AND** the frontend MUST describe the accepted response as queued rather than completed
- **AND** the records list MUST refresh to show the newly submitted run

### Requirement: Data update records cannot be mutated

The system MUST NOT expose edit or delete controls for data update records.

#### Scenario: User views record list

- **WHEN** the data update records page is rendered
- **THEN** no edit or delete action MUST be available
