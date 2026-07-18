# Finishing the demo: pending items design

Date: 2026-07-18

## Context

`CLAUDE.md` lists 5 "pending — next session" items. One (rate limiting on auth) is
already implemented (`backend/src/middlewares/rateLimitMiddleware.js`, wired into
`POST /api/auth/login`) — `CLAUDE.md`'s pending list is stale on that point and will
be updated. The remaining four are independent, smaller features:

1. Email notifications (nodemailer) on ticket assign/status/comment events
2. Ticket change-history timeline in TicketDetail
3. README screenshots
4. Landing page polish

## 1. Email notifications

**Provider:** Ethereal (nodemailer's fake SMTP test service). No real credentials
needed — a disposable test account is created at server boot, and "sent" emails are
never delivered; each one gets a preview URL logged to the console. This fits a
portfolio/demo project and sidesteps putting another real secret in `backend/.env`
(which is already a known tracked-secrets issue).

**New file:** `backend/src/services/emailService.js`
- Lazily creates a nodemailer transporter via `nodemailer.createTestAccount()` on
  first use, cached at module scope (mirrors the singleton pool pattern in
  `config/db.js`).
- Exports `sendMail({ to, subject, html })`. Wraps `transporter.sendMail`, logs
  `nodemailer.getTestMessageUrl(info)` on success. Catches and logs errors without
  throwing — fire-and-forget, same resilience pattern already used by
  `Activity.log` and `Notif.create` (both swallow errors internally so a logging/
  notification failure never breaks the ticket request).

**Call sites:** `backend/src/controllers/ticketController.js`, alongside the existing
three `Notif.create(...)` calls:
- `updateTicket` → assignee notified on `assigned_to` change
- `updateTicket` → creator notified on `status` change
- `commentTicket` → creator and/or assignee notified on new comment

Each site fetches the recipient's email via `User.findById(userId, companyId)`
(already exists in `userModel.js`) and calls `sendMail` with a subject/body mirroring
the in-app notification's title/message. No template engine — plain inline HTML
string, consistent with the project's lean-dependency style.

**Out of scope:** real SMTP provider config, retry queues, email preferences/opt-out.
If this becomes a real product, swapping the transporter for real SMTP env vars is a
future-roadmap item, not part of this pass.

## 2. Ticket history timeline

**Backend:** new `GET /api/tickets/:id/activity` route + controller function in
`ticketController.js`. Reuses the existing `activity_log` table (no schema change) —
queries `WHERE company_id = ? AND entity_type = 'ticket' AND entity_id = ?`, ordered
by `created_at ASC`. Enforces the same per-role visibility as `getTicket`: `user` role
only if they created the ticket, `technician` only if assigned, `admin` always. Joins
`users` for actor name, same shape as the existing admin activity log query.

**Frontend:** `TicketDetail.jsx` fetches this endpoint alongside the ticket detail
call and renders a vertical timeline (dot + connecting line, consistent with the
existing dark violet theme) — one entry per activity row, with a human-readable label
per action (`ticket_created`, `ticket_updated` diffed from `metadata`, `comment_added`),
actor name, and relative/localized timestamp. Placed below the comments thread or in
the metadata panel — decided during implementation based on available vertical space.

## 3. README screenshots

Use browser automation to run the app locally (`docker compose up`), log in with a
seeded/demo account, and capture: Landing, Login, Dashboard (with filters), Kanban,
TicketDetail (with the new history timeline from #2), AdminReports, AdminSLA. Save to
`docs/screenshots/*.png`. Add a "Screenshots" section to `README.md` embedding them,
and update the README's roadmap checklist to reflect reality (check off rate limiting,
and the three items above once done).

## 4. Landing page polish

`Landing.jsx` (644 lines) is already a fairly complete landing page — hero, feature
cards with mini visual previews, tech stack strip, scroll-reveal animations. This pass
is a refinement, not a rebuild: typography/spacing consistency, visual hierarchy, and
alignment with the rest of the app's design system (violet accent, `#080810` dark
background, Plus Jakarta Sans). No new sections.

## Testing

- Email: verify via the Ethereal preview URLs printed to console during manual
  testing of assign/status-change/comment flows.
- Ticket history: manual check that timeline entries appear in correct order and
  respect role visibility (user/technician/admin) for a given ticket.
- README/landing: visual review, no automated tests applicable.

## Out of scope for this pass

Everything under "Future roadmap (post-portfolio)" in `CLAUDE.md` — file attachments,
JWT secret rotation, backups, monitoring, etc. Not touched here.
