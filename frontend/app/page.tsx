"use client";

import Link from "next/link";
import { Zap, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import VectorGraphCanvas from "@/components/VectorGraphCanvas";

export default function HomePage() {
  const curlSnippet = `# 1. Invoke the Content Rewriter endpoint via cURL
curl -X POST "http://localhost:8000/api/connectors/content-rewriter/invoke" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: uah_rewrite_demo_key_2026_abc123" \\
  -d '{
    "text": "Universal AI Hub transforms prompts into production-grade APIs.",
    "tone": "concise",
    "word_count": 15
  }'

# 2. Standardized JSON Response (200 OK)
# {
#   "success": true,
#   "data": {
#     "rewritten_text": "Universal AI Hub turns prompts into reliable, typed production APIs.",
#     "word_count": 10
#   },
#   "error": null,
#   "meta": {
#     "latency_ms": 210.4,
#     "tokens": 128,
#     "estimated_cost": 0.000019,
#     "provider": "groq",
#     "model": "llama-3.1-8b-instant"
#   }
# }`;

  const pythonSnippet = `import requests

# 1. Connect to Universal AI Hub
api_url = "http://localhost:8000/api/connectors/card-scanner/invoke"
headers = {"X-API-Key": "uah_card_demo_key_2026_xyz987"}

# 2. Upload Business Card image directly to vision model
with open("business_card.png", "rb") as image_file:
    response = requests.post(
        api_url,
        headers=headers,
        files={"image": image_file}
    )

# 3. Access validated, structured JSON data
payload = response.json()
contact = payload["data"]

print(f"Name:    {contact['name']}")
print(f"Company: {contact['company']}")
print(f"Email:   {contact['email']}")
# Output: Alex Morgan | Apex Dynamics | alex@apexdynamics.io`;

  const jsSnippet = `// Invoke any AI connector in JavaScript / Node.js
const response = await fetch("http://localhost:8000/api/connectors/content-rewriter/invoke", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "uah_rewrite_demo_key_2026_abc123",
  },
  body: JSON.stringify({
    text: "Building AI integrations from scratch creates maintenance debt.",
    tone: "persuasive",
    word_count: 20,
  }),
});

const { success, data, meta } = await response.json();

console.log("Rewritten Text:", data.rewritten_text);
console.log("Latency:", meta.latency_ms, "ms");
console.log("Tokens Consumed:", meta.tokens);`;

  return (
    <div className="w-full bg-white">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 border-b border-black">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-mono font-bold tracking-tight leading-[1] uppercase text-black">
              THE UNIVERSAL,
              <br />
              HIGH-SPEED
              <br />
              AI API HUB.
            </h1>

            <p className="font-mono text-xs uppercase tracking-widest text-black/80 font-bold">
              DEPLOY CUSTOM AI ENDPOINTS IN SECONDS. ZERO BOILERPLATE.
            </p>

            <p className="font-sans text-sm sm:text-base text-neutral-700 leading-relaxed max-w-xl">
              Universal AI Hub lets you configure, deploy, and monitor custom AI-powered API endpoints
              without writing backend boilerplate. Connect Google Gemini, Groq, and OpenAI with
              dynamic input validation, automated schema repair, and real-time cost observability.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/connectors/card-scanner/docs"
                className="btn-surge-white text-xs px-6 py-3 inline-block"
              >
                DOCUMENTATION
              </Link>
              <Link
                href="/connectors/content-rewriter/test"
                className="btn-surge-orange text-xs px-6 py-3 inline-block"
              >
                TRY CHAT DEMO
              </Link>
            </div>
          </div>

          {/* Right Column: Animated AI Gateway Network Canvas */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <VectorGraphCanvas />
          </div>
        </div>
      </section>

      {/* 2. "BUILT FOR PRODUCTION" 4-CARD ROW */}
      <section className="border-b border-black bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight uppercase text-black">
              BUILT FOR PRODUCTION
            </h2>
            <p className="font-sans text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Most AI integrations are brittle one-off scripts. Universal AI Hub is engineered as a dependable,
              multi-model gateway with strict contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="border border-black bg-white p-7 hover:shadow-[4px_4px_0px_#e07850] transition-all">
              <div className="mb-6">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 text-black">
                ULTRA-LOW LATENCY
              </h3>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Direct async HTTP pooling with Groq LPUs and Gemini Flash yields sub-second
                structured JSON output.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-black bg-white p-7 hover:shadow-[4px_4px_0px_#e07850] transition-all">
              <div className="mb-6">
                <ArrowRight className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 text-black">
                MULTIMODAL INGESTION
              </h3>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Hand-tuned vision adapters process images and documents directly without
                requiring external storage pipelines.
              </p>
            </div>

            {/* Card 3 */}
            <div className="border border-black bg-white p-7 hover:shadow-[4px_4px_0px_#e07850] transition-all">
              <div className="mb-6">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 text-black">
                PLUG-AND-PLAY REPAIR
              </h3>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Built-in JSON sanitization strips markdown fences, repairs trailing syntax,
                and guarantees strict schema conformance.
              </p>
            </div>

            {/* Card 4 */}
            <div className="border border-black bg-white p-7 hover:shadow-[4px_4px_0px_#e07850] transition-all">
              <div className="mb-6">
                <Activity className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 text-black">
                ZERO LEAK TELEMETRY
              </h3>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Clean, typed FastAPI backend and Next.js frontend with isolated SQLAlchemy telemetry
                and per-connector hashed keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "POWERING THE INTELLIGENT EDGE" 6-CARD SECTION */}
      <section className="border-b border-black bg-neutral-50/60 py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <h2 className="text-4xl sm:text-5xl font-mono font-bold tracking-tight uppercase text-black">
              POWERING THE INTELLIGENT EDGE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-black p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  1
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Multi-Provider AI Gateway
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Route requests seamlessly across Google Gemini, Groq, and OpenAI through a
                  unified adapter interface with automatic pricing calculations.
                </p>
              </div>
            </div>

            {/* Card 2 (Special Orange Border Accent) */}
            <div className="bg-white border-2 border-[#e07850] p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-[#e07850] text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  2
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Dynamic Multimodal Ingestion
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Accept images, documents, numbers, and structured JSON. Validate inputs
                  automatically before dispatching to vision and reasoning models.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-black p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  3
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Auto Schema Validation
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Enforce strict JSON schemas. If a model output deviates, the built-in repair
                  engine recovers syntax and normalizes missing keys.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-black p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  4
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Sub-Second LPU Execution
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Leverage Groq LPUs and Gemini Flash for lightning-fast inference, returning
                  validated data in milliseconds for latency-critical applications.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-black p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  5
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Zero-Leak Security Model
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Provider keys remain strictly server-side. Connectors authenticate with
                  hashed API keys, protecting credentials and isolating client access.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-black p-8 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm mb-6">
                  6
                </div>
                <h3 className="font-mono font-bold text-xl text-black mb-3">
                  Real-time Analytics & Logs
                </h3>
                <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                  Track token volume, latency distributions, error classifications, and exact
                  cost telemetry with try/except isolated persistence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CODE SECTION: "SIMPLE. POWERFUL. INTUITIVE." (CURL, PYTHON, JAVASCRIPT ONLY) */}
      <section className="max-w-7xl mx-auto px-6 py-28 border-b border-black">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-8">
            <h2 className="text-6xl sm:text-7xl font-mono font-bold tracking-tight leading-[0.95] text-black uppercase">
              SIMPLE.
              <br />
              POWERFUL.
              <br />
              INTUITIVE.
            </h2>

            <p className="font-mono text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl">
              We spent months obsessing over the API so you don&apos;t have to.
              Whether you&apos;re calling endpoints via cURL, integrating with Python,
              or building modern TypeScript web apps, Universal Hub feels like home.
            </p>

            <ul className="space-y-3 font-mono text-xs font-bold tracking-widest uppercase text-black pt-2">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-black inline-block flex-shrink-0"></span>
                <span>TYPE-SAFE ADAPTERS</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-black inline-block flex-shrink-0"></span>
                <span>ASYNC/AWAIT HTTP PIPELINE</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-black inline-block flex-shrink-0"></span>
                <span>AUTO SCHEMA REPAIR & VALIDATION</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Exact SurgeDB Code Window (cURL, Python, JavaScript only) */}
          <div className="lg:col-span-6">
            <CodeBlock
              tabs={[
                { id: "curl", label: "CURL", code: curlSnippet },
                { id: "python", label: "PYTHON", code: pythonSnippet },
                { id: "javascript", label: "JAVASCRIPT", code: jsSnippet },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 5. PRE-SEEDED DEMO CONNECTORS SHOWCASE */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-14 gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#e07850] block mb-2">
                // Instant Demonstration
              </span>
              <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight uppercase text-black">
                PRE-CONFIGURED CONNECTORS
              </h2>
            </div>
            <Link
              href="/connectors/new"
              className="btn-surge-black"
            >
              + Create Connector
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card A */}
            <div className="border border-black bg-white p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                    Connector A • Vision
                  </span>
                  <span className="font-mono text-[10px] text-[#e07850] font-bold uppercase">
                    Gemini 2.0 Flash (Free)
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-mono font-bold uppercase text-black">
                    Business Card Scanner
                  </h3>
                  <p className="font-sans text-xs text-neutral-600 mt-2 leading-relaxed">
                    Accepts a business card photo, passes it to Gemini Vision, and extracts
                    name, company, title, phone, email, and website into structured JSON.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href="/connectors/card-scanner/test"
                  className="btn-surge-orange text-xs py-2 px-3 flex-1 text-center"
                >
                  Test In Playground
                </Link>
                <Link
                  href="/connectors/card-scanner/docs"
                  className="btn-surge-white text-xs py-2 px-3 text-center"
                >
                  Docs
                </Link>
              </div>
            </div>

            {/* Card B */}
            <div className="border border-black bg-white p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                    Connector B • High-Speed Text
                  </span>
                  <span className="font-mono text-[10px] text-[#e07850] font-bold uppercase">
                    Groq Llama 3.1 (Free)
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-mono font-bold uppercase text-black">
                    Content Rewriter
                  </h3>
                  <p className="font-sans text-xs text-neutral-600 mt-2 leading-relaxed">
                    Rewrites copy, blogs, and technical notes into targeted tones and word counts with
                    ultra-low latency on Groq LPUs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href="/connectors/content-rewriter/test"
                  className="btn-surge-orange text-xs py-2 px-3 flex-1 text-center"
                >
                  Test In Playground
                </Link>
                <Link
                  href="/connectors/content-rewriter/docs"
                  className="btn-surge-white text-xs py-2 px-3 text-center"
                >
                  Docs
                </Link>
              </div>
            </div>

            {/* Card C */}
            <div className="border border-black bg-white p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                    Connector C • Sentiment
                  </span>
                  <span className="font-mono text-[10px] text-[#e07850] font-bold uppercase">
                    Groq Llama 3.1 (Free)
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-mono font-bold uppercase text-black">
                    Sentiment Analyzer
                  </h3>
                  <p className="font-sans text-xs text-neutral-600 mt-2 leading-relaxed">
                    Analyzes customer feedback and reviews to extract sentiment polarity,
                    emotional tone score, and key opinion drivers in milliseconds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href="/connectors/sentiment-analyzer/test"
                  className="btn-surge-orange text-xs py-2 px-3 flex-1 text-center"
                >
                  Test In Playground
                </Link>
                <Link
                  href="/connectors/sentiment-analyzer/docs"
                  className="btn-surge-white text-xs py-2 px-3 text-center"
                >
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
