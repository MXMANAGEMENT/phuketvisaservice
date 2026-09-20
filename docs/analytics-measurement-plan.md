# Analytics measurement plan

## Decision goal

Identify which service, language, location page and acquisition source produces qualified WhatsApp enquiries without increasing low-intent clicks or collecting personal form data.

## Primary KPIs

1. **Qualified contact rate** = sessions with `case_check` / sessions with `service_view` on a service or location page.
2. **WhatsApp contact rate** = sessions with `whatsapp_click` / sessions with `service_view`.
3. **Pricing-to-contact rate** = sessions with `whatsapp_click` after `pricing_view` / sessions with `pricing_view`.

Use unique `lead_id` per browser session for deduplication. A click is not a confirmed sale; CRM qualification and revenue must later be joined through the visible eight-character reference included in the WhatsApp message.

## Driver events

| Event | Trigger | Decision supported |
|---|---|---|
| `service_view` | Meaningful page load | Traffic and denominator |
| `case_check_view` | 45% of early case-check panel visible | Whether users reach the first conversion surface |
| `service_scope_view` | 45% of support-scope block visible | Interest in what is included |
| `pricing_view` | 45% of pricing block visible | Commercial intent |
| `case_check` | Qualified WhatsApp CTA clicked | Primary lead intent |
| `whatsapp_click` | Any WhatsApp CTA clicked | Total WhatsApp demand |
| `phone_click` / `email_click` | Contact link clicked | Alternative contact demand |
| `faq_open` | FAQ opened | Objection and information demand |

## Standard dimensions

- `service_slug`
- `page_language`
- `page_path`
- `location`
- `lead_id`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid`, `fbclid`

Attribution is first-touch within the browser session. Values are sanitized and limited to 100 characters. Events are forwarded to analytics only after the relevant consent.

## GA4 dashboard layout

1. Scorecards: qualified contact rate, WhatsApp contact rate, pricing-to-contact rate.
2. Funnel: `service_view` → `case_check_view` → `pricing_view` → `case_check`.
3. Table: service × language with sessions, qualified contacts and rate.
4. Acquisition table: source / medium / campaign with qualified contacts and rate.
5. Location-page table: `page_path` with case-check rate.

Register `service_slug`, `page_language`, `location` and `lead_id` as event-scoped custom dimensions in GA4. Mark `case_check` as a key event. Do not mark passive view events as key events.

## Targets and guardrails

- Initial directional target: qualified contact rate at or above 5% on high-intent service traffic.
- Set a final target only after at least 30 days and enough traffic for a stable baseline.
- Guardrail: no duplicate event per element view in one page load.
- Guardrail: no analytics or marketing forwarding without consent.
- Guardrail: no nationality, visa type, expiry date or message content in analytics payloads.
- Guardrail: monitor lead quality in the CRM; a higher click rate must not be treated as success if qualified-lead share declines.
