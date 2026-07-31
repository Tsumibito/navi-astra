# Navi.training analytics measurement plan

## Objective

Measure acquisition and the lead funnel without sending personal data to analytics. Cloudflare Zaraz owns Google Analytics and consent. Public pages must not embed GTM or a second GA4 tag.

## Event contract

| Event | When it fires | Parameters | GA4 key event |
| --- | --- | --- | --- |
| `page_view` | Once per page, from the standard Zaraz Pageviews action | Standard GA4 page fields | No |
| `form_open` | A lead, newsletter, or waitlist dialog opens | `form_name`, `service` or `method`, `locale`, `page_path` | No |
| `form_start` | First real input in that form | `form_name`, `service` or `method`, `locale`, `page_path` | No |
| `generate_lead` | Payload confirms a contact lead was stored | `form_name`, `service`, `locale`, `page_path` | Yes |
| `sign_up` | Payload confirms a newsletter or course-waitlist subscription | `form_name`, `method`, `locale`, `page_path` | Yes |

`generate_lead` and `sign_up` are emitted only after a successful API response. Never send names, email addresses, phone numbers, message text, location entered in a form, or raw query strings.

## Zaraz configuration

Keep exactly one Google Analytics 4 tool and one standard Pageviews action. Do not create locale-specific pageview actions.

Create Custom Event triggers for `form_open`, `form_start`, `generate_lead`, and `sign_up`. Connect each trigger to a GA4 event action with the same event name and map the safe parameters from the event payload. Assign the analytics consent purpose `amuB` to these actions.

The site calls `zaraz.track(eventName, parameters)`. The shared adapter briefly queues events only while Zaraz initializes and falls back to `dataLayer` only if a future deployment intentionally introduces it.

## GA4 configuration

Mark only these as key events:

- `generate_lead`
- `sign_up`

Do not mark `form_open` or `form_start` as key events. Archive obsolete Webstudio-era conversion names only after documenting their historical date range; old data cannot be backfilled.

Register these event-scoped custom dimensions when breakdowns are needed:

- `form_name`
- `service`
- `method`
- `locale`

`page_path` is already available through standard page dimensions and usually does not need a custom definition.

## Recommended reports

Build one lead-funnel exploration:

1. `form_open`
2. `form_start`
3. `generate_lead` or `sign_up`

Break it down by page path, locale, service, device category, source/medium, campaign, and country. Monitor the completion rates from open to start and from start to successful lead.

## Validation checklist

1. Accept analytics consent in a test browser.
2. Use Zaraz Debugger and GA4 DebugView.
3. Open a form and enter a non-sensitive test value; verify one `form_open` and one `form_start`.
4. Submit a designated test lead; verify exactly one success event after Payload returns success.
5. Reject analytics consent in a fresh session and confirm GA4 receives no consented analytics event.
6. Confirm no event parameter contains form values or the URL query string.
