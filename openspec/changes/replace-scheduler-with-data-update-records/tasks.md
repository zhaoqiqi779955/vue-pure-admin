## 1. API Contract

- [x] 1.1 Add typed data update run models, filters, pagination response, and GET request wrapper for `/api/dashboard/daily/updates`

## 2. Read-only Records Page

- [x] 2.1 Replace task-name and handler filters with data type, status, and target-date range filters
- [x] 2.2 Replace scheduler configuration columns with update-run outcome columns and status formatting
- [x] 2.3 Remove create, edit, and delete controls plus obsolete form files

## 3. Navigation and Specifications

- [x] 3.1 Update Chinese and English scheduler menu labels to data update records while preserving the route path
- [x] 3.2 Update the main OpenSpec scheduler capability to the new data update records contract

## 4. Verification

- [x] 4.1 Run focused lint/format checks and TypeScript type checking
- [x] 4.2 Run the production build and review the final diff for unrelated changes

## 5. Range Job and Error Summary Compatibility

- [x] 5.1 Update frontend API types and filters for trigger source, target range, aggregate progress, leases, error summary, and submission/execution timestamps
- [x] 5.2 Replace legacy single-date result columns and statuses with range-job source, progress, outcome, and timestamp presentation
- [x] 5.3 Render bounded error-summary cells with an empty placeholder and full-content tooltip, and add trigger-source filtering
- [x] 5.4 Run focused lint/format, TypeScript checking, production build, and strict OpenSpec validation

## 6. Manual Data Update Submission

- [x] 6.1 Add typed POST request wrapper for submitting an inclusive data update range
- [x] 6.2 Add a manual submission dialog with data type, required date range, future-date prevention, and 366-day validation
- [x] 6.3 Submit the task asynchronously, show queued feedback, and refresh the records list after acceptance
- [x] 6.4 Run focused lint/format, TypeScript checking, production build, strict OpenSpec validation, and final diff review
