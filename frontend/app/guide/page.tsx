"use client";

import { useState } from "react";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import {
  Key,
  Shield,
  Zap,
  Terminal,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  Sliders,
  FileCode,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "javascript">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sampleCurl = `curl -X POST https://api.universalhub.dev/api/connectors/card-scanner/invoke \\
  -H "X-API-Key: uah_live_9f83b2a761e0413c" \\
  -F "card_image=@/path/to/business_card.png" \\
  -F "extract_socials=true"`;

  const samplePython = `import requests

url = "https://api.universalhub.dev/api/connectors/card-scanner/invoke"
headers = {"X-API-Key": "uah_live_9f83b2a761e0413c"}

with open("business_card.png", "rb") as img:
    files = {"card_image": ("business_card.png", img, "image/png")}
    data = {"extract_socials": "true"}
    response = requests.post(url, headers=headers, files=files, data=data)

result = response.json()
print("Success:", result["success"])
print("Extracted Data:", result["data"])
print("Latency:", result["meta"]["latency_ms"], "ms")`;

  const sampleJs = `const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function scanCard() {
  const form = new FormData();
  form.append('card_image', fs.createReadStream('business_card.png'));
  form.append('extract_socials', 'true');

  const res = await axios.post(
    'https://api.universalhub.dev/api/connectors/card-scanner/invoke',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-API-Key': 'uah_live_9f83b2a761e0413c',
      },
    }
  );

  console.log('Contract Payload:', res.data.data);
  console.log('Model Used:', res.data.meta.model_used);
}

scanCard();`;

  const sampleOllamaCommand = `# 1. Install & launch Ollama locally
curl -fsSL https://ollama.com/install.sh | sh
ollama serve

# 2. Pull your desired models (Text or Multimodal Vision)
ollama pull llama3.2:latest      # Ultra-fast 3B local text model
ollama pull deepseek-r1:8b       # Local reasoning & coding
ollama pull llava:latest          # Offline multimodal image recognition`;

  return (
    <div className="bg-white text-black selection:bg-[#e07850] selection:text-white pb-20">
      <div>
        {/* Hero Section */}
        <section className="border-b border-black py-16 px-6 bg-neutral-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black text-xs font-mono mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#e07850] animate-pulse" />
              Platform Architecture & User Manual
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold tracking-tight text-black max-w-4xl leading-tight">
              Universal AI Hub <br />
              <span className="text-[#e07850]">Developer & Operator Guide</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-neutral-600 font-sans max-w-2xl leading-relaxed">
              Learn how to design, secure, test, and expose reusable, production-ready AI microservices 
              backed by Google Gemini, Groq, OpenAI, or local offline Ollama models—with zero boilerplate code.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-wider">
              <a
                href="#quick-start"
                className="btn-surge btn-surge-black px-6 py-3"
              >
                Quick Start →
              </a>
              <a
                href="#ollama-offline"
                className="btn-surge btn-surge-white px-6 py-3"
              >
                Offline Ollama Guide
              </a>
              <Link
                href="/dashboard"
                className="btn-surge btn-surge-white px-6 py-3 border-neutral-300 hover:border-black"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Nav Anchor Bar */}
        <div className="sticky top-[69px] z-30 bg-white/95 backdrop-blur-md border-b border-black py-3 px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-neutral-600 whitespace-nowrap">
            <span className="text-black font-bold">JUMP TO:</span>
            <a href="#architecture" className="hover:text-[#e07850] transition-colors">
              1. Architecture Flow
            </a>
            <a href="#quick-start" className="hover:text-[#e07850] transition-colors">
              2. Creating a Connector
            </a>
            <a href="#ollama-offline" className="hover:text-[#e07850] transition-colors">
              3. Offline Ollama Setup
            </a>
            <a href="#invoking" className="hover:text-[#e07850] transition-colors">
              4. API Consumption
            </a>
            <a href="#schema-repair" className="hover:text-[#e07850] transition-colors">
              5. Schema Auto-Repair
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 space-y-24">
          {/* SECTION 1: ARCHITECTURE & LIFECYCLE */}
          <section id="architecture" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#e07850] uppercase tracking-widest">
                [01 // SYSTEM OVERVIEW]
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight mb-4">
              How Universal AI Hub Operates
            </h2>
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed mb-8">
              Universal AI Hub acts as an enterprise AI API Gateway between client applications and heterogeneous foundation models. 
              Instead of scattering raw LLM API keys and brittle prompts across multiple repos, you define typed connectors once with schema contracts, input guardrails, and automated key rotation.
            </p>

            {/* Visual Flow diagram cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-black p-5 bg-white relative">
                <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-mono text-xs font-bold mb-4">
                  01
                </div>
                <h3 className="font-mono font-bold text-sm text-black uppercase tracking-wider mb-2">
                  Client Request
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Client sends a standard REST POST with JSON or multipart/form-data with an <code className="bg-neutral-100 px-1 border border-neutral-200 text-black">X-API-Key</code>.
                </p>
                <div className="mt-4 font-mono text-[10px] text-neutral-400">
                  HTTP / cURL / Python / JS
                </div>
              </div>

              <div className="border border-black p-5 bg-white relative">
                <div className="w-8 h-8 rounded bg-[#e07850] text-black flex items-center justify-center font-mono text-xs font-bold mb-4">
                  02
                </div>
                <h3 className="font-mono font-bold text-sm text-black uppercase tracking-wider mb-2">
                  Gateway & Security
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Gateway verifies the SHA-256 key hash, enforces connector active status, and validates inputs against typed definitions.
                </p>
                <div className="mt-4 font-mono text-[10px] text-neutral-400">
                  SHA-256 · Injection Guards
                </div>
              </div>

              <div className="border border-black p-5 bg-white relative">
                <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-mono text-xs font-bold mb-4">
                  03
                </div>
                <h3 className="font-mono font-bold text-sm text-black uppercase tracking-wider mb-2">
                  Provider Dispatch
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Adapter executes inference via Gemini, Groq, OpenAI, or local Ollama using system prompts and JSON schema directives.
                </p>
                <div className="mt-4 font-mono text-[10px] text-neutral-400">
                  Cloud or 100% Offline
                </div>
              </div>

              <div className="border border-black p-5 bg-white relative">
                <div className="w-8 h-8 rounded bg-[#e07850] text-black flex items-center justify-center font-mono text-xs font-bold mb-4">
                  04
                </div>
                <h3 className="font-mono font-bold text-sm text-black uppercase tracking-wider mb-2">
                  Repair & Telemetry
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Schema Repair Engine strips markdown fences and fixes syntax errors before returning an audit-logged envelope.
                </p>
                <div className="mt-4 font-mono text-[10px] text-neutral-400">
                  Audit Log · Latency · Cost
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: HOW TO CREATE A CONNECTOR */}
          <section id="quick-start" className="scroll-mt-32 border-t border-black pt-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#e07850] uppercase tracking-widest">
                [02 // OPERATOR WORKFLOW]
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight mb-4">
              Step-by-Step: Creating a Reusable AI Connector
            </h2>
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed mb-8">
              Follow this 4-minute workflow to build your first production endpoint in the web console:
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border border-black p-6 bg-white flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 flex-shrink-0 bg-black text-white font-mono font-bold text-base flex items-center justify-center">
                  S1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#e07850] font-bold">
                      AUTHENTICATE
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-base text-black mb-2">
                    Sign in to the Admin Console
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                    Navigate to <code className="bg-neutral-100 px-1.5 py-0.5 border border-neutral-200 text-black font-mono">/login</code>.
                    For instant testing, use the pre-seeded demo button <strong>[Auto-Fill Demo Admin]</strong> which enters:
                  </p>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-700">
                    Email: <span className="font-bold text-black">admin@universalhub.dev</span> &nbsp;|&nbsp; Password: <span className="font-bold text-black">Admin123!</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border border-black p-6 bg-white flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 flex-shrink-0 bg-black text-white font-mono font-bold text-base flex items-center justify-center">
                  S2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#e07850] font-bold">
                      IDENTITY & ROUTE
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-base text-black mb-2">
                    Define Connector Slug & Model Provider
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                    Click <strong>[+ NEW CONNECTOR]</strong>. Give your connector a clean, descriptive name and URL slug (e.g. <code className="bg-neutral-100 px-1 border border-neutral-200 text-black">receipt-parser</code>).
                    Select from 4 active backend engines:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 border border-neutral-200 bg-neutral-50">
                      <div className="font-bold text-black mb-1">Google Gemini</div>
                      <div className="text-neutral-500 text-[11px]">Best for Multimodal Vision (PDF/PNG) & 1M context.</div>
                    </div>
                    <div className="p-3 border border-neutral-200 bg-neutral-50">
                      <div className="font-bold text-black mb-1">Groq LPU</div>
                      <div className="text-neutral-500 text-[11px]">Ultra-fast inference (&lt;500ms) with Llama 3.3.</div>
                    </div>
                    <div className="p-3 border border-neutral-200 bg-neutral-50">
                      <div className="font-bold text-black mb-1">OpenAI</div>
                      <div className="text-neutral-500 text-[11px]">Frontier reasoning with GPT-4o and mini models.</div>
                    </div>
                    <div className="p-3 border border-black bg-neutral-100">
                      <div className="font-bold text-black mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Ollama (Offline)
                      </div>
                      <div className="text-neutral-500 text-[11px]">100% private, runs on local GPU/CPU with $0 cost.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-black p-6 bg-white flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 flex-shrink-0 bg-black text-white font-mono font-bold text-base flex items-center justify-center">
                  S3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#e07850] font-bold">
                      SCHEMA CONTRACT
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-base text-black mb-2">
                    Configure Input Parameters & Expected JSON Schema
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                    Declare the input variables your users must provide. Choose from 6 strongly-typed categories:
                    <span className="font-mono font-semibold text-black"> text, number, boolean, image, file, json</span>.
                    Then declare your desired output JSON structure. The Hub automatically wraps this in strict prompt delimiters.
                  </p>
                  <div className="bg-neutral-900 text-neutral-100 p-4 font-mono text-xs overflow-x-auto border border-black">
                    <span className="text-emerald-400">// Example Output Schema Contract:</span>
                    <pre className="mt-2 text-white">{`{
  "merchant": "string",
  "total_amount": "number",
  "currency": "string",
  "items": [{ "name": "string", "price": "number" }],
  "tax_identified": "boolean"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border border-black p-6 bg-white flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 flex-shrink-0 bg-[#e07850] text-black font-mono font-bold text-base flex items-center justify-center">
                  S4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-black font-bold">
                      INSTANT DEPLOYMENT
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-base text-black mb-2">
                    Save Connector & Receive Live API Key
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                    Click <strong>[CREATE CONNECTOR & GENERATE KEY]</strong>. Your one-time raw secret key (prefixed with <code className="bg-neutral-100 px-1 border border-neutral-200 text-black">uah_live_...</code>) is displayed. 
                    Copy it immediately: the backend only persists a cryptographically secure <strong>SHA-256 hash</strong>.
                  </p>
                  <div className="p-3 bg-[#e07850]/10 border border-[#e07850] text-xs font-mono text-black">
                    Endpoint immediately deployed at: <span className="font-bold underline">/api/connectors/{`{slug}`}/invoke</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: OFFLINE LOCAL OLLAMA SETUP */}
          <section id="ollama-offline" className="scroll-mt-32 border-t border-black pt-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#e07850] uppercase tracking-widest">
                [03 // PRIVATE & OFFLINE]
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight mb-4">
              Local Offline AI with Ollama
            </h2>
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed mb-6">
              Want zero external API bills or need to process sensitive proprietary data in an air-gapped environment? 
              Universal AI Hub natively supports <strong>Ollama</strong> as a first-class provider running locally on your workstation or GPU server.
            </p>

            <div className="border border-black bg-white p-6 mb-8">
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-black mb-3">
                How to set up local Ollama in 2 minutes:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-neutral-700 leading-relaxed">
                    <strong>Install Ollama:</strong> Download from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-black hover:text-[#e07850]">ollama.com</a> or run the terminal installer:
                    <div className="mt-2 bg-neutral-900 text-neutral-100 p-3 font-mono text-xs border border-black flex justify-between items-center">
                      <code>curl -fsSL https://ollama.com/install.sh | sh</code>
                      <button
                        onClick={() => copyToClipboard("curl -fsSL https://ollama.com/install.sh | sh", "ollama-install")}
                        className="text-neutral-400 hover:text-white"
                      >
                        {copiedSnippet === "ollama-install" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-neutral-700 leading-relaxed">
                    <strong>Pull Recommended Open-Weight Models:</strong>
                    <div className="mt-2 bg-neutral-900 text-neutral-100 p-3 font-mono text-xs border border-black">
                      <div className="text-neutral-400">// Fast structured text & JSON extraction (3B)</div>
                      <div className="text-white">ollama pull llama3.2:latest</div>
                      <div className="mt-2 text-neutral-400">// Deep reasoning & coding (8B)</div>
                      <div className="text-white">ollama pull deepseek-r1:8b</div>
                      <div className="mt-2 text-neutral-400">// Multimodal local vision & OCR (7B)</div>
                      <div className="text-white">ollama pull llava:latest</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-neutral-700 leading-relaxed">
                    <strong>Launch the Engine:</strong> Ensure Ollama is running on its default port:
                    <div className="mt-2 bg-neutral-900 text-neutral-100 p-3 font-mono text-xs border border-black">
                      <code>ollama serve</code> &nbsp;<span className="text-neutral-400">(Listening on http://localhost:11434)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#e07850] text-black flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="text-xs text-neutral-700 leading-relaxed">
                    <strong>Create Connector in Universal AI Hub:</strong> In the connector creation form, select <strong>Ollama (Offline/Local)</strong>. 
                    Click <em>Refresh Models</em> to automatically detect all downloaded models on your machine!
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Specs Comparison */}
            <div className="border border-black overflow-hidden bg-white">
              <div className="p-4 bg-neutral-100 border-b border-black font-mono text-xs font-bold uppercase tracking-wider">
                Ollama vs Cloud Providers Comparison
              </div>
              <div className="overflow-x-auto font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                    <tr>
                      <th className="p-3">Attribute</th>
                      <th className="p-3">Local Ollama</th>
                      <th className="p-3">Groq LPU</th>
                      <th className="p-3">Google Gemini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="p-3 font-bold">API Incurred Cost</td>
                      <td className="p-3 text-emerald-600 font-bold">$0.00 (Local Hardware)</td>
                      <td className="p-3 text-neutral-700">~$0.05 / 1M tokens</td>
                      <td className="p-3 text-neutral-700">~$0.075 / 1M tokens</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Privacy / Air-Gapped</td>
                      <td className="p-3 text-emerald-600 font-bold">100% Offline (No Data Egress)</td>
                      <td className="p-3 text-neutral-700">Cloud Data Center</td>
                      <td className="p-3 text-neutral-700">Google Cloud Platform</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Typical Latency</td>
                      <td className="p-3 text-neutral-700">Hardware Dependent (GPU/CPU)</td>
                      <td className="p-3 text-emerald-600 font-bold">250ms - 600ms (Blazing)</td>
                      <td className="p-3 text-neutral-700">600ms - 1400ms</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Native JSON Mode</td>
                      <td className="p-3 text-neutral-700">Supported (`format: "json"`)</td>
                      <td className="p-3 text-neutral-700">Supported (json_object)</td>
                      <td className="p-3 text-neutral-700">Supported (Structured Schema)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SECTION 4: HOW USERS & DEVELOPERS CONSUME THE API */}
          <section id="invoking" className="scroll-mt-32 border-t border-black pt-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#e07850] uppercase tracking-widest">
                [04 // DEVELOPER INTEGRATION]
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight mb-4">
              Calling Your AI Connector in Production
            </h2>
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed mb-6">
              Every connector is accessible via standard REST POST. Downstream engineers authenticate with the secret key header 
              <code className="bg-neutral-100 px-1 border border-neutral-200 text-black font-mono">X-API-Key: uah_live_...</code>. 
              The response always follows the predictable Universal Envelope format.
            </p>

            {/* Code Tabs: Only cURL, Python, JavaScript */}
            <div className="border border-black bg-white">
              <div className="flex items-center justify-between border-b border-black px-4 py-2 bg-neutral-100">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={() => setActiveTab("curl")}
                    className={`px-3 py-1 font-bold transition-colors ${
                      activeTab === "curl"
                        ? "bg-black text-white"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveTab("python")}
                    className={`px-3 py-1 font-bold transition-colors ${
                      activeTab === "python"
                        ? "bg-black text-white"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveTab("javascript")}
                    className={`px-3 py-1 font-bold transition-colors ${
                      activeTab === "javascript"
                        ? "bg-black text-white"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    JavaScript
                  </button>
                </div>

                <button
                  onClick={() => {
                    const text = activeTab === "curl" ? sampleCurl : activeTab === "python" ? samplePython : sampleJs;
                    copyToClipboard(text, "code-tab");
                  }}
                  className="font-mono text-xs flex items-center gap-1.5 text-neutral-600 hover:text-black"
                >
                  {copiedSnippet === "code-tab" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-neutral-950 font-mono text-xs text-neutral-100 overflow-x-auto">
                <pre>
                  {activeTab === "curl" && sampleCurl}
                  {activeTab === "python" && samplePython}
                  {activeTab === "javascript" && sampleJs}
                </pre>
              </div>
            </div>

            {/* Standard Response Envelope Specification */}
            <div className="mt-8 border border-black bg-white p-6">
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-black mb-3">
                Standardized Universal Response Envelope
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Regardless of which LLM or local model was used underneath, the response structure remains rock-solid and uniform:
              </p>
              <div className="bg-neutral-900 text-neutral-100 p-4 font-mono text-xs overflow-x-auto border border-black">
                <pre>{`{
  "success": true,
  "data": {
    "name": "Sarah Connor",
    "company": "Cyberdyne Systems",
    "email": "sarah@cyberdyne.io",
    "phone": "+1 415-555-0199",
    "skills": ["Robotics", "Systems Security"]
  },
  "error": null,
  "meta": {
    "connector_slug": "card-scanner",
    "model_used": "gemini-1.5-flash",
    "latency_ms": 782.4,
    "tokens": {
      "input": 128,
      "output": 84,
      "total": 212
    },
    "cost_usd": 0.000034,
    "schema_repaired": false
  }
}`}</pre>
              </div>
            </div>
          </section>

          {/* SECTION 5: RESILIENT SCHEMA AUTO-REPAIR */}
          <section id="schema-repair" className="scroll-mt-32 border-t border-black pt-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#e07850] uppercase tracking-widest">
                [05 // RESILIENCY & FAULT TOLERANCE]
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight mb-4">
              Self-Healing JSON Schema Engine
            </h2>
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed mb-6">
              Foundation models frequently violate strict JSON parsers by wrapping outputs in markdown tags, adding conversational preambles, or appending illegal trailing commas. 
              Universal AI Hub features a multi-pass regex recovery pipeline that fixes these malformed payloads automatically before returning to your application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="border border-black p-4 bg-white">
                <div className="font-bold text-black uppercase mb-2">1. Markdown Fence Stripping</div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Removes <code className="bg-neutral-100 px-1 border">```json ... ```</code> wrappers and any conversational apologies like <em>&quot;Here is your data:&quot;</em>.
                </p>
              </div>
              <div className="border border-black p-4 bg-white">
                <div className="font-bold text-black uppercase mb-2">2. Trailing Comma Repair</div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Cleans syntax errors where LLMs leave dangling commas before closing braces (e.g. <code className="bg-neutral-100 px-1 border">{`{"key": "val",}`}</code>).
                </p>
              </div>
              <div className="border border-black p-4 bg-white">
                <div className="font-bold text-black uppercase mb-2">3. Shape Normalization</div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Ensures all expected keys from your declared schema exist in the final returned payload with appropriate defaults if omitted.
            </div>
          </section>

          {/* CTA Box */}
            <div className="mt-12 p-8 border-2 border-black bg-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-mono font-bold text-xl text-black">
                  Ready to test drive Universal AI Hub?
                </h3>
                <p className="text-xs text-neutral-600 font-sans mt-1">
                  Launch the interactive test console or create your own custom AI microservice in 60 seconds.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="btn-surge btn-surge-black px-6 py-3 font-mono text-xs"
                >
                  Sign In to Console →
                </Link>
                <Link
                  href="/connectors/card-scanner/test"
                  className="btn-surge btn-surge-white px-6 py-3 font-mono text-xs"
                >
                  Try Card Scanner
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
