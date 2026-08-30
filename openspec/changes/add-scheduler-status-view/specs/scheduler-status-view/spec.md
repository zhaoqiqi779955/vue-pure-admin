## ADDED Requirements

### Requirement: Display scheduler status beside update records

The scheduler tasks page SHALL retain data update records as its default view and SHALL provide a separate scheduler-status tab.

#### Scenario: Open the scheduler tasks page

- **WHEN** a user opens `/scheduler/tasks`
- **THEN** the data update records view remains selected and its existing submission and filtering interactions remain available

#### Scenario: Select scheduler status

- **WHEN** a user selects the scheduler-status tab
- **THEN** the application fetches and renders the scheduler status collection without mixing it with update-run records

### Requirement: Render scheduler lease metadata clearly

The scheduler-status table SHALL show job name, Cron expression, next run time, last submission time, last submission result, lease owner, lease expiry, and last update time. The table SHALL label `last_status` as a submission result rather than a collection outcome.

#### Scenario: Render a populated schedule collection

- **WHEN** the schedule API returns one or more records
- **THEN** every record is displayed with formatted timestamps and a visible submission-result column

#### Scenario: Render missing-date scan schedule

- **WHEN** the schedule API returns `job_name=missing_date_scan_daily`
- **THEN** the scheduler-status table labels the job as the missing-date scan
- **AND** renders scan statuses such as `submitted`, `skipped_unfinished`, `no_missing`, and `failed` as readable submission results

#### Scenario: Render an uninitialized scheduler

- **WHEN** the schedule API returns an empty collection
- **THEN** the scheduler-status tab displays an empty-state message indicating that no scheduler record has been initialized

#### Scenario: Scheduler status loading fails

- **WHEN** the schedule API request fails
- **THEN** the application displays an error message and provides a refresh action without affecting data update records
