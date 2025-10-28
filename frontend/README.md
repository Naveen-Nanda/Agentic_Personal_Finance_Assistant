# Frontend README

Your frontend (Angular, React, anything) just needs to POST to the orchestrator service.

Example fetch (TypeScript):

```ts
async function analyzeFinancialSituation() {
  const payload = {
    salary: 95000,
    spending: { rent:1500, food:600, subscriptions:120, misc:400 },
    credit_cards: ["chase_freedom","amex_gold"],
    financial_goals: ["pay off debt","build emergency fund"]
  };

  const resp = await fetch("http://<EXTERNAL-IP>/api/v1/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error("API error " + resp.status);
  }

  const data = await resp.json();
  console.log(data.plan);
  return data;
}
```

You display `data.plan` to the user.