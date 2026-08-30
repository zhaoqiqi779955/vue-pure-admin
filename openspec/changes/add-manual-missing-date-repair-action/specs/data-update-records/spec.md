# Data Update Records Manual Repair Delta

## ADDED Requirements

### Requirement: Manually trigger missing-data repair

The data update records page SHALL provide a manual action that triggers the backend missing-date scan endpoint and submits repair jobs for missing recent working-day dashboard data.

#### Scenario: Confirm manual missing-data repair

- **WHEN** the user clicks the manual missing-data repair action
- **THEN** the application displays a confirmation prompt explaining that the operation scans recent working-day missing data and submits repair tasks
- **AND** no request is sent unless the user confirms

#### Scenario: Submit manual missing-data repair request

- **WHEN** the user confirms the manual missing-data repair action
- **THEN** the frontend calls `POST /api/dashboard/daily/missing-date-scans`
- **AND** the request does not include data-type or date-range parameters
- **AND** the action button remains disabled or loading until the request completes

#### Scenario: Display manual repair summary

- **WHEN** the backend returns a successful manual missing-date scan summary
- **THEN** the frontend displays a success message containing the number of submitted repair tasks
- **AND** the message distinguishes the zero-submission case from the positive-submission case
- **AND** the data update records list refreshes

#### Scenario: Manual repair request fails

- **WHEN** the manual missing-data repair request fails
- **THEN** the frontend displays an error message
- **AND** the existing records table content, filters, pagination, and active tab remain unchanged
