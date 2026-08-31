## MODIFIED Requirements

### Requirement: Data update records navigation

The system SHALL expose `/scheduler/tasks` as the frontend task-operation entry and MUST NOT expose the legacy task-management menu or static routes.

#### Scenario: Data update records menu appears

- **WHEN** the application loads static routes
- **THEN** the navigation menu MUST show `数据更新记录`
- **AND** the navigation menu MUST NOT show the legacy `任务管理` entry

#### Scenario: Existing data update records route remains reachable

- **WHEN** the user opens `/scheduler/tasks`
- **THEN** the data update records page MUST be rendered

#### Scenario: Legacy task management routes are removed

- **WHEN** the application builds its static route collection
- **THEN** `/task-management` and `/task-management/tasks` MUST NOT be registered
