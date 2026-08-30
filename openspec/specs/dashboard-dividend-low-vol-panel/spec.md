# dashboard-dividend-low-vol-panel Specification

## Purpose

Define the Dashboard dividend low-volatility index panel, latest-data loading, metric display, and index-level / D/P1 dividend-yield trend chart behavior.

## Requirements

### Requirement: Fetch latest dividend low-volatility data by default

The system SHALL request the latest dividend low-volatility index data from `GET /api/dashboard/daily` with `data_type=dividend_low_vol` and a closed date range no longer than 366 calendar days when the Dashboard page loads. The frontend SHALL unwrap each daily-dashboard item's `value` object for the dividend low-volatility panel.

#### Scenario: Default dividend low-volatility request

- **WHEN** the user enters the Dashboard page
- **THEN** the frontend MUST call `/api/dashboard/daily` with `data_type=dividend_low_vol`, an end date of the current date, and a start date 365 days earlier

#### Scenario: Latest dividend low-volatility record selection

- **WHEN** the API returns one or more `items`
- **THEN** the page MUST use the item with the latest `date` as the current dividend low-volatility record

#### Scenario: Empty dividend low-volatility response

- **WHEN** the API returns no usable item
- **THEN** the dividend low-volatility panel MUST show an empty state instead of rendering zero-valued metrics

### Requirement: Render dividend low-volatility latest metrics

The system SHALL render a Dashboard panel for CSI Dividend Low Volatility Index `H30269` between the market-core panel and the core-ETF panel.

#### Scenario: Latest metrics are shown

- **WHEN** the latest dividend low-volatility record is available
- **THEN** the panel MUST show `index_level` as `指数点位` with unit `点`
- **AND** show `dividend_yield_percent` as `D/P1 股息率` with unit `%`
- **AND** show the latest record date as the panel data date

#### Scenario: Loading and error states

- **WHEN** the dividend low-volatility request is loading or fails
- **THEN** the panel MUST show the matching loading skeleton or error message without affecting other Dashboard panels

### Requirement: Open dividend low-volatility trend dialog

The system SHALL allow users to click either dividend low-volatility metric and open a trend dialog for persisted `index_level` and `dividend_yield_percent` values.

#### Scenario: Open trend dialog

- **WHEN** the user clicks the index-level or D/P1 dividend-yield metric
- **THEN** the system MUST open a trend dialog whose default range ends at the latest available dividend low-volatility data date
- **AND** the default start date MUST be 365 days before that end date

#### Scenario: User changes trend range

- **WHEN** the user changes the trend date range
- **THEN** the frontend MUST reload `/api/dashboard/daily` with `data_type=dividend_low_vol` and the selected `start_date` and `end_date`

### Requirement: Render dividend low-volatility dual-axis trend chart

The system SHALL render `index_level` and `dividend_yield_percent` in one line chart using separate Y axes because the two metrics have different units and magnitudes.

#### Scenario: Trend chart rendering

- **WHEN** trend data is returned
- **THEN** the chart MUST sort records by `date` ascending
- **AND** render `index_level` on the point-level axis
- **AND** render `dividend_yield_percent` on the dividend-yield axis

#### Scenario: Missing trend values

- **WHEN** a persisted item has no finite `index_level` or `dividend_yield_percent` value
- **THEN** that chart value MUST be rendered as missing instead of `0`
- **AND** the chart MUST NOT connect missing values across dates

#### Scenario: Trend empty response

- **WHEN** the trend API returns no usable item
- **THEN** the trend dialog MUST show an empty state instead of rendering an empty chart
