# dashboard-zhongxin-short-data Specification

## Purpose

Define the Zhongxin short position core dashboard menu, data loading, field grouping, label mapping, and bar chart rendering behavior.

## Requirements

### Requirement: Dashboard menu entry

The system SHALL provide a top-level `dashboard` menu entry labeled `核心看板` for core dashboard pages.

#### Scenario: Dashboard appears as top-level menu

- **WHEN** the application loads available static routes
- **THEN** the navigation menu MUST include a top-level dashboard entry displayed as `核心看板`

#### Scenario: Zhongxin short position page is reachable

- **WHEN** the user opens the dashboard menu
- **THEN** the user MUST be able to navigate to the Zhongxin short position data page under dashboard

### Requirement: Fetch latest Zhongxin short position data by default

The system SHALL request the latest Zhongxin short position data from `GET /api/dashboard/daily` with `data_type=zhongxin_future` and a closed date range no longer than 366 calendar days when the page loads. The frontend SHALL unwrap each daily-dashboard item's `value` object for the existing Zhongxin short position panel.

#### Scenario: Default page load request

- **WHEN** the user enters the Zhongxin short position page
- **THEN** the frontend MUST call `/api/dashboard/daily` with `data_type=zhongxin_future`, an end date of the current date, and a start date 365 days earlier

#### Scenario: Latest record selection

- **WHEN** the API returns one or more `items`
- **THEN** the page MUST use the latest record for display

#### Scenario: Empty response

- **WHEN** the API returns no usable item
- **THEN** the page MUST show an empty state instead of rendering zero-valued charts

### Requirement: Group latest values into cumulative and diff sections

The system SHALL split the latest Zhongxin short position record into cumulative short position values and short position change values.

#### Scenario: Cumulative short position group

- **WHEN** the latest record is available
- **THEN** the cumulative section MUST include `IH_net_short`, `IF_net_short`, `IC_net_short`, `IM_net_short`, and `total_net_short`

#### Scenario: Short position change group

- **WHEN** the latest record is available
- **THEN** the change section MUST include `IH_net_short_diff`, `IF_net_short_diff`, `IC_net_short_diff`, `IM_net_short_diff`, and `total_net_short_diff`

### Requirement: Map Zhongxin field names to Chinese labels

The system SHALL display business labels for Zhongxin short position fields instead of raw API field names.

#### Scenario: Cumulative labels are mapped

- **WHEN** the cumulative section is rendered
- **THEN** `IH_net_short` MUST display as `上证50`, `IF_net_short` as `沪深300`, `IC_net_short` as `中证500`, `IM_net_short` as `中证1000`, and `total_net_short` as `总空单`

#### Scenario: Diff labels reuse base field mapping

- **WHEN** the change section is rendered
- **THEN** each `_diff` field MUST remove the `_diff` suffix for mapping and display `IH_net_short_diff` as `上证50`, `IF_net_short_diff` as `沪深300`, `IC_net_short_diff` as `中证500`, `IM_net_short_diff` as `中证1000`, and `total_net_short_diff` as `总空单`

### Requirement: Render each value as bar chart data

The system SHALL render both Zhongxin short position sections as bar charts.

#### Scenario: Cumulative bar chart

- **WHEN** cumulative short position data is available
- **THEN** the page MUST render one bar per cumulative field using the mapped Chinese labels

#### Scenario: Change bar chart

- **WHEN** short position change data is available
- **THEN** the page MUST render one bar per change field using the mapped Chinese labels

#### Scenario: Negative values

- **WHEN** any displayed value is negative
- **THEN** the bar chart MUST preserve the signed value instead of converting it to an absolute value

### Requirement: Render cumulative trend tooltip with diff values

The system SHALL show both cumulative value and corresponding diff value when the user hovers over a point in the cumulative short position trend line chart.

#### Scenario: Trend tooltip includes current and diff values

- **WHEN** the user hovers over a point in the cumulative short position trend line chart
- **THEN** the tooltip MUST show the current cumulative value and the corresponding `_diff` value for each displayed index line
