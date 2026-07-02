## MODIFIED Requirements

### Requirement: Fetch core ETF trend by date range

The system SHALL fetch core ETF trend data with `start_date` and `end_date` query parameters.

#### Scenario: Default trend range

- **WHEN** the core ETF trend charts load
- **THEN** the frontend MUST request `/api/data/etf/core` with a default recent-one-year date range

#### Scenario: Trend range is centered on latest ETF data date

- **WHEN** the latest core ETF record has a valid `date`
- **THEN** the default trend `end_date` MUST use that latest date
- **AND** the default trend `start_date` MUST be one year before that latest date

#### Scenario: User changes trend range

- **WHEN** the user changes the trend date range
- **THEN** the frontend MUST reload `/api/data/etf/core` with the selected `start_date` and `end_date`
