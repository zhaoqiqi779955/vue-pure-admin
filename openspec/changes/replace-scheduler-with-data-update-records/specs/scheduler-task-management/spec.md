## REMOVED Requirements

### Requirement: Scheduler menu entry

**Reason**: The frontend now exposes collection execution observability rather than scheduler configuration management.
**Migration**: Use the data update records entry at the existing `/scheduler/tasks` route.

### Requirement: List scheduled tasks

**Reason**: The old `/api/scheduler/tasks` contract is replaced by the daily dashboard update-run query contract.
**Migration**: Query `GET /api/dashboard/daily/updates` and render collection run fields.

### Requirement: Filter scheduled tasks

**Reason**: Task-name and handler filters are not part of the new update-run API.
**Migration**: Filter records by data type, status, and target-date range.

### Requirement: Paginate scheduled tasks

**Reason**: Pagination now applies to update-run records rather than task configuration rows.
**Migration**: Continue mapping table pagination to `limit` and `offset` on `/api/dashboard/daily/updates`.

### Requirement: Manage scheduled tasks

**Reason**: The daily dashboard service exposes update records as read-only data and does not support scheduler CRUD.
**Migration**: Remove create, edit, and delete controls; scheduler configuration remains backend-owned.
