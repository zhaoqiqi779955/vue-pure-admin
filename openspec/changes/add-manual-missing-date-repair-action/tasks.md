# Manual Missing-Date Repair Action Tasks

## 1. API Access

- [x] 1.1 Add a TypeScript response type for manual missing-date scan summaries
- [x] 1.2 Add `submitMissingDateScan()` calling `POST /api/dashboard/daily/missing-date-scans`

## 2. Page Interaction

- [x] 2.1 Add a “修复缺失数据” button beside the existing “提交更新任务” button on the data update records toolbar
- [x] 2.2 Add a confirmation prompt describing the default scan window and working-day candidate rule
- [x] 2.3 Add loading state to prevent duplicate manual repair requests
- [x] 2.4 Display a success summary with the submitted repair count and handle the zero-submission case clearly
- [x] 2.5 Refresh the data update records list after a successful manual repair request
- [x] 2.6 Display an error message on request failure without clearing current filters, pagination, or table data

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`
- [x] 3.2 Run targeted ESLint for changed frontend files
- [x] 3.3 Run `openspec validate add-manual-missing-date-repair-action --strict`
- [x] 3.4 Review final diff for unrelated changes
