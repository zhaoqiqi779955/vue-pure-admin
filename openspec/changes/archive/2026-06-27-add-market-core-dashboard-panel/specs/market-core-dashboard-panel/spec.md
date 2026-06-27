## ADDED Requirements

### Requirement: Fetch latest market core data by default

The system SHALL request the latest market core data from `GET /api/data/market/core` without query parameters when the Dashboard page loads.

#### Scenario: Default market core request

- **WHEN** the user enters the Dashboard page
- **THEN** the frontend MUST call `/api/data/market/core` without `start_date` or `end_date`

#### Scenario: Latest market core record selection

- **WHEN** the API returns one or more `items`
- **THEN** the page MUST use the item with the latest `date` as the current market core record

#### Scenario: Empty market core response

- **WHEN** the API returns no usable item
- **THEN** the market core panel MUST show an empty state or placeholder values instead of rendering misleading zero values

### Requirement: Render market core panel above existing dashboard content

The system SHALL render the market core data panel at the top of the Dashboard page before the existing Zhongxin short position content.

#### Scenario: Market core panel placement

- **WHEN** the Dashboard page is rendered
- **THEN** the market core panel MUST appear above the Zhongxin short position section

#### Scenario: Market core metrics are shown

- **WHEN** the latest market core record is available
- **THEN** the panel MUST show `total_amount_yi` as `成交额` with unit `亿`
- **AND** show `limit_up_count` as `涨停家数` with unit `家`
- **AND** show `limit_down_count` as `跌停家数` with unit `家`

### Requirement: Open single metric trend from market core panel

The system SHALL allow users to click each market core metric and open a trend dialog for that single metric.

#### Scenario: Click turnover metric

- **WHEN** the user clicks the `成交额` metric
- **THEN** the system MUST open a trend dialog showing only `total_amount_yi`

#### Scenario: Click limit up metric

- **WHEN** the user clicks the `涨停家数` metric
- **THEN** the system MUST open a trend dialog showing only `limit_up_count`

#### Scenario: Click limit down metric

- **WHEN** the user clicks the `跌停家数` metric
- **THEN** the system MUST open a trend dialog showing only `limit_down_count`

### Requirement: Fetch market core trend by date range

The system SHALL fetch market core trend data with `start_date` and `end_date` query parameters.

#### Scenario: Default trend range

- **WHEN** a market core metric trend dialog opens
- **THEN** the frontend MUST request `/api/data/market/core` with a default recent-half-year date range

#### Scenario: Trend range is centered on latest data date

- **WHEN** the latest market core record has a valid `date`
- **THEN** the default trend `end_date` MUST use that latest date
- **AND** the default trend `start_date` MUST be six months before that latest date

#### Scenario: User changes trend range

- **WHEN** the user changes the trend date range
- **THEN** the frontend MUST reload `/api/data/market/core` with the selected `start_date` and `end_date`

### Requirement: Render market core single metric line chart

The system SHALL render the selected market core metric as a line chart.

#### Scenario: Trend data rendering

- **WHEN** trend data is returned
- **THEN** the chart MUST sort records by `date` ascending
- **AND** render one line using the selected metric values

#### Scenario: Turnover chart value conversion

- **WHEN** the selected metric is `total_amount_yi`
- **THEN** the chart MUST convert the string value to a number for plotting
- **AND** keep the display unit as `亿`

#### Scenario: Trend empty response

- **WHEN** the trend API returns no usable item
- **THEN** the trend dialog MUST show an empty state instead of rendering an empty chart
