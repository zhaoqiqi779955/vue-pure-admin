## ADDED Requirements

### Requirement: Fetch latest core ETF data by default

The system SHALL request the latest core ETF data from `GET /api/data/etf/core` without query parameters when the Dashboard page loads.

#### Scenario: Default core ETF request

- **WHEN** the user enters the Dashboard page
- **THEN** the frontend MUST call `/api/data/etf/core` without `start_date` or `end_date`

#### Scenario: Latest core ETF record selection

- **WHEN** the API returns one or more `items`
- **THEN** the page MUST use the item with the latest `date` as the current core ETF record

#### Scenario: Empty core ETF response

- **WHEN** the API returns no usable item
- **THEN** the core ETF panel MUST show an empty state or placeholder values instead of rendering misleading zero values

### Requirement: Render latest core ETF metrics

The system SHALL render each ETF's latest fund share and unit NAV in the Dashboard core ETF panel.

#### Scenario: Latest ETF metrics are shown

- **WHEN** the latest core ETF record is available
- **THEN** the panel MUST show each ETF's `share_yi` as `基金份额` with unit `亿份`
- **AND** show each ETF's `unit_nav` as `单位净值`

#### Scenario: ETF display order

- **WHEN** the API returns ETF data for `510300`, `510500`, and `512100`
- **THEN** the panel MUST display them in the order `510300`, `510500`, `512100`

#### Scenario: Additional ETF codes

- **WHEN** the API returns ETF codes outside the configured core ETF order
- **THEN** the panel MUST append those ETFs after the configured ETF codes

### Requirement: Fetch core ETF trend by date range

The system SHALL fetch core ETF trend data with `start_date` and `end_date` query parameters.

#### Scenario: Default trend range

- **WHEN** the core ETF trend charts load
- **THEN** the frontend MUST request `/api/data/etf/core` with a default recent-half-year date range

#### Scenario: Trend range is centered on latest ETF data date

- **WHEN** the latest core ETF record has a valid `date`
- **THEN** the default trend `end_date` MUST use that latest date
- **AND** the default trend `start_date` MUST be six months before that latest date

#### Scenario: User changes trend range

- **WHEN** the user changes the trend date range
- **THEN** the frontend MUST reload `/api/data/etf/core` with the selected `start_date` and `end_date`

### Requirement: Render core ETF fund share line chart

The system SHALL render core ETF fund share data as a multi-series line chart.

#### Scenario: Fund share chart rendering

- **WHEN** trend data is returned
- **THEN** the chart MUST sort records by `date` ascending
- **AND** render one line per ETF using `share_yi`
- **AND** display the unit as `亿份`

#### Scenario: Missing fund share values

- **WHEN** an ETF has no finite `share_yi` value for a date
- **THEN** that date's chart value for the ETF MUST be rendered as missing instead of `0`

### Requirement: Render core ETF unit NAV line chart

The system SHALL render core ETF unit NAV data as a multi-series line chart.

#### Scenario: Unit NAV chart rendering

- **WHEN** trend data is returned
- **THEN** the chart MUST sort records by `date` ascending
- **AND** render one line per ETF using `unit_nav`

#### Scenario: Missing unit NAV values

- **WHEN** an ETF has no finite `unit_nav` value for a date
- **THEN** that date's chart value for the ETF MUST be rendered as missing instead of `0`

#### Scenario: Trend empty response

- **WHEN** the trend API returns no usable item
- **THEN** the core ETF trend area MUST show an empty state instead of rendering empty charts
