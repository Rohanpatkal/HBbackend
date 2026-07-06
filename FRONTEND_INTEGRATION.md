# Frontend Integration Guide

Base URL: `http://localhost:5000/api` (dev) or your Render URL (prod)

---

## Setup

### 1. Create an API config file

```js
// lib/api.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}
```

---

## Endpoints

---

### POST `/user/createUser`
Create a new user. Call this on registration.

**Request**
```js
const user = await apiFetch("/user/createUser", {
  method: "POST",
  body: JSON.stringify({
    name: "Rohan",
    email: "rohan@test.com",
    password: "123456",
  }),
});

// Save this — you'll need it for all other calls
const userId = user.userId;
```

**Response**
```json
{
  "success": true,
  "userId": "6867a1f2c3d4e5f678901234",
  "message": "User created successfully",
  "data": { ... }
}
```

---

### POST `/data/textFormater`
Upload a `.txt` file to parse and save habit data. Call this on the upload screen.

**Request**
```js
const formData = new FormData();
formData.append("file", fileInput.files[0]); // file input element
formData.append("userId", userId);

const res = await fetch(`${BASE_URL}/data/textFormater`, {
  method: "POST",
  body: formData,
  // Do NOT set Content-Type manually — browser sets it with boundary
});
const data = await res.json();
```

**Response**
```json
{
  "2024": {
    "04": [
      { "date": "2024-04-02", "count": 3, "breakCount": 0, "mood": "", "notes": "" }
    ]
  }
}
```

---

### GET `/stats/:userId/summary`
Global stats — use this for the dashboard header/stat cards.

**Request**
```js
const { data } = await apiFetch(`/stats/${userId}/summary`);
```

**Response**
```json
{
  "success": true,
  "data": {
    "totalCount": 268,
    "totalYears": 4,
    "totalMonths": 28,
    "yearMax": { "year": "2024", "count": 96 },
    "yearMin": { "year": "2023", "count": 38 },
    "monthMax": { "month": "03/2026", "count": 17 },
    "monthMin": { "month": "07/2025", "count": 4 },
    "years": ["2023", "2024", "2025", "2026"]
  }
}
```

**UI usage**
```jsx
// Stat cards
<StatCard label="Total"         value={data.totalCount} />
<StatCard label="Best Year"     value={`${data.yearMax.year} (${data.yearMax.count})`} />
<StatCard label="Best Month"    value={`${data.monthMax.month} (${data.monthMax.count})`} />

// Year selector dropdown
{data.years.map(year => (
  <option key={year} value={year}>{year}</option>
))}
```

---

### GET `/stats/:userId/yearly`
Year-wise totals — use this for a bar/line chart comparing years.

**Request**
```js
const { data } = await apiFetch(`/stats/${userId}/yearly`);
```

**Response**
```json
{
  "success": true,
  "data": [
    { "year": "2023", "count": 38,  "totalMonths": 4  },
    { "year": "2024", "count": 96,  "totalMonths": 12 },
    { "year": "2025", "count": 92,  "totalMonths": 12 },
    { "year": "2026", "count": 42,  "totalMonths": 4  }
  ]
}
```

**UI usage (Recharts example)**
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

<BarChart data={data}>
  <XAxis dataKey="year" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#6366f1" />
</BarChart>
```

---

### GET `/stats/:userId/monthly/:year`
All months in a year — use this when a user clicks/selects a year.

**Request**
```js
const result = await apiFetch(`/stats/${userId}/monthly/2024`);
// result.year, result.yearTotal, result.data (array of months)
```

**Response**
```json
{
  "success": true,
  "year": "2024",
  "yearTotal": 96,
  "data": [
    {
      "monthKey": "01/2024",
      "count": 8,
      "totalDays": 6,
      "days": [
        { "date": "08/01/2024", "count": 1, "breakCount": 0, "mood": "", "notes": [] },
        { "date": "12/01/2024", "count": 1, "breakCount": 0, "mood": "", "notes": [] }
      ]
    },
    {
      "monthKey": "04/2024",
      "count": 15,
      "totalDays": 9,
      "days": [ ... ]
    }
  ]
}
```

**UI usage (Recharts example)**
```jsx
// Monthly bar chart
<BarChart data={result.data}>
  <XAxis dataKey="monthKey" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#22c55e" />
</BarChart>
```

---

### GET `/stats/:userId/monthly/:year/:month`
Single month detail — use this when a user clicks a month bar.

**Request**
```js
// month is zero-padded: "04" not "4"
const result = await apiFetch(`/stats/${userId}/monthly/2024/04`);
```

**Response**
```json
{
  "success": true,
  "month": "04/2024",
  "count": 15,
  "totalDays": 9,
  "max": { "date": "02/04/2024", "count": 3 },
  "min": { "date": "11/04/2024", "count": 1 },
  "days": [
    { "date": "02/04/2024", "count": 3, "breakCount": 0, "mood": "", "notes": [] },
    { "date": "11/04/2024", "count": 1, "breakCount": 0, "mood": "", "notes": [] }
  ]
}
```

**UI usage**
```jsx
// Detail card header
<h2>{result.month}</h2>
<p>Total: {result.count} over {result.totalDays} days</p>
<p>Best day: {result.max.date} ({result.max.count})</p>
<p>Lowest day: {result.min.date} ({result.min.count})</p>

// Day list or small chart
{result.days.map(day => (
  <div key={day.date}>
    <span>{day.date}</span>
    <span>{day.count}</span>
  </div>
))}
```

---

## Recommended Page Flow

```
/register
  → POST /user/createUser
  → save userId to localStorage or context

/upload
  → POST /data/textFormater (with file + userId)

/dashboard  (loads on mount)
  → GET /stats/:userId/summary       → stat cards + year list

/dashboard?year=2024
  → GET /stats/:userId/yearly        → yearly bar chart
  → GET /stats/:userId/monthly/2024  → monthly chart for selected year

/dashboard?year=2024&month=04
  → GET /stats/:userId/monthly/2024/04  → day detail panel
```

---

## Error Handling

Every endpoint returns `success: true/false`. Handle errors like this:

```js
try {
  const { data } = await apiFetch(`/stats/${userId}/summary`);
  // use data
} catch (err) {
  console.error(err.message); // show toast or error UI
}
```

---

## Environment Variables

Add to your frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, set it to your Render URL:
```
NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api
```
