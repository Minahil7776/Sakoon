# Admin UI redesign (inspired by the MindCare reference)

Copy these files over your project. Same paths. No database changes, no new packages.

NEW
- app/admin/charts.js   (SVG trend chart + donut, no chart library needed)
- app/admin/icons.js    (inline icons)

CHANGED
- app/admin/page.js     (new overview: KPI cards, chart, donut, review queue, activity, alerts)
- app/admin/layout.js   (new sidebar with sections, avatar, sign-out icon)
- app/admin/AdminNav.js (icons + MAIN / SYSTEM groups)
- app/admin/admin.css   (full replacement)
- app/admin/ui.js       (adds Avatar)
- app/admin/verifications/ReviewActions.js (adds compact icon mode for the queue)
- lib/format.js         (adds timeAgo)
