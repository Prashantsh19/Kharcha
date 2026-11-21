import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }), {
    status: 503, headers: { "Content-Type": "application/json" }
  });

  const { question } = await req.json();
  const month = new Date().toISOString().slice(0, 7) + "-01";
  const [{ data: expenses }, { data: incomes }, { data: budgets }] = await Promise.all([
    supabase.from("expenses").select("amount, category, merchant, transaction_date").eq("user_id", user.id).gte("transaction_date", month).order("transaction_date"),
    supabase.from("incomes").select("amount, source, income_date").eq("user_id", user.id).gte("income_date", month),
    supabase.from("budgets").select("category, amount").eq("user_id", user.id).eq("month", month)
  ]);

  const prompt = `You are Kharcha, a privacy-preserving student finance assistant.
Analyze only this user's current-month records below. Be concise, practical, and never invent values.
Expenses: ${JSON.stringify(expenses ?? [])}
Incomes: ${JSON.stringify(incomes ?? [])}
Budgets: ${JSON.stringify(budgets ?? [])}
Question: ${question}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "Answer only from supplied financial records. Use INR and avoid financial guarantees." },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!response.ok) return new Response(JSON.stringify({ error: "AI provider request failed" }), {
    status: 502, headers: { "Content-Type": "application/json" }
  });
  const result = await response.json();
  return new Response(JSON.stringify({ answer: result.choices?.[0]?.message?.content || "I could not generate an answer." }), {
    headers: { "Content-Type": "application/json" }
  });
});
