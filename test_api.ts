async function run() {
  try {
    console.log("=== Testing status endpoint ===");
    const res1 = await fetch("http://localhost:3000/api/db/status");
    console.log("Status status:", res1.status);
    try {
      console.log("Status response:", await res1.json());
    } catch {
      console.log("Status text:", await res1.text());
    }

    console.log("\n=== Testing ai-correct-questions endpoint ===");
    const res2 = await fetch("http://localhost:3000/api/db/ai-correct-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    console.log("AI healing status:", res2.status);
    try {
      console.log("AI healing response:", await res2.json());
    } catch {
      console.log("AI healing text:", await res2.text());
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
