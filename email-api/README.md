# Outlook Email API

Receives emails from Power Automate and exposes them via REST API.

---

## Deploy on Railway

1. Push this folder to a GitHub repo
2. Go to railway.app → New Project → Deploy from GitHub
3. Add these environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| MONGO_URI | your MongoDB Atlas connection string |
| WEBHOOK_SECRET | any strong random string (e.g. abc123xyz) |
| PORT | 3000 |

4. Railway gives you a URL like: `https://your-app.up.railway.app`

---

## Power Automate Setup (Boss does this once)

1. Go to make.powerautomate.com
2. Create → Automated cloud flow
3. Trigger: "When a new email arrives (V3)"
4. Add step → HTTP → POST

```
Method: POST
URI: https://your-app.up.railway.app/api/webhook/new-email?secret=YOUR_WEBHOOK_SECRET
Headers: Content-Type: application/json
Body:
{
  "subject": "@{triggerOutputs()?['body/subject']}",
  "from": "@{triggerOutputs()?['body/from']}",
  "body": "@{triggerOutputs()?['body/body']}",
  "receivedAt": "@{triggerOutputs()?['body/receivedDateTime']}"
}
```

5. Save the flow. Done.

---

## API Endpoints for Developer

Base URL: `https://your-app.up.railway.app`

All GET/DELETE requests need this header:
```
Authorization: Bearer YOUR_WEBHOOK_SECRET
```

### GET /api/emails
Fetch latest emails (paginated)

```
GET /api/emails?page=1&limit=20
```

Response:
```json
{
  "total": 45,
  "page": 1,
  "limit": 20,
  "emails": [
    {
      "_id": "abc123",
      "subject": "Meeting at 3pm",
      "from": "someone@company.com",
      "body": "Please join the call...",
      "receivedAt": "2026-04-13T10:30:00.000Z"
    }
  ]
}
```

### GET /api/emails/:id
Fetch a single email by ID

```
GET /api/emails/abc123
```

### DELETE /api/emails/:id
Delete an email

```
DELETE /api/emails/abc123
```

### POST /api/webhook/new-email?secret=YOUR_SECRET
Called by Power Automate only. Not for developer use.

---

## Quick Test (after deploy)

```bash
curl https://your-app.up.railway.app/

curl -H "Authorization: Bearer YOUR_SECRET" \
  https://your-app.up.railway.app/api/emails
```
