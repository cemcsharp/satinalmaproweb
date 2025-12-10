// Dataset ingestion and enrichment pipeline
// - Sources: CSV, JSON, images (metadata), time series (synthetic), text (docs)
// - Cleaning: trim strings, numeric parsing, null removal
// - Normalization: unified schema (id, type, source, context, payload)
// - Enrichment: derived metrics (token counts, category mapping)

import fs from "fs";
import path from "path";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Minimal CSV parser for simple datasets (no quoted commas)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj = {};
    header.forEach((h, i) => (obj[h] = cols[i] ?? null));
    return obj;
  });
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listImages(dir) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
  return fs
    .readdirSync(dir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return { name: f, path: full, size: stat.size, ext: path.extname(f).toLowerCase() };
    });
}

function generateTimeSeries(days = 30) {
  const today = new Date();
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const requests = 20 + Math.floor(Math.random() * 80);
    const orders = 10 + Math.floor(Math.random() * 50);
    const spend = Number((Math.random() * 10000 + 5000).toFixed(2));
    arr.push({ date, requests, orders, spend });
  }
  return arr;
}

function readTextSnippets(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const snippets = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    const lines = content.split(/\r?\n/).filter(Boolean);
    const excerpt = lines.slice(0, 5).join(" ");
    snippets.push({ file: f, text: excerpt });
  }
  return snippets;
}

// Cleaning helpers
function cleanRecord(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === "string") {
      const s = v.trim();
      out[k] = s === "" ? null : s;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Normalization & enrichment
function normalizeNumeric(record, source) {
  const payload = {};
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === "string" && /^-?[0-9]+(\.[0-9]+)?$/.test(v)) {
      payload[k] = Number(v);
    } else {
      payload[k] = v;
    }
  }
  return {
    id: `${source}:${Math.random().toString(36).slice(2, 8)}`,
    type: "numeric",
    source,
    context: { format: "csv" },
    payload,
  };
}

function normalizeCategorical(record, source) {
  // Map common categorical fields to a canonical set
  const categoryMap = {
    pending: "Beklemede",
    completed: "Tamamlandı",
    canceled: "İptal",
  };
  const payload = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, typeof v === "string" ? categoryMap[v.toLowerCase()] || v : v])
  );
  return {
    id: `${source}:${Math.random().toString(36).slice(2, 8)}`,
    type: "categorical",
    source,
    context: { format: "json" },
    payload,
  };
}

function normalizeImage(meta, source) {
  return {
    id: `${source}:${Math.random().toString(36).slice(2, 8)}`,
    type: "image",
    source,
    context: { ext: meta.ext },
    payload: { path: path.relative(process.cwd(), meta.path), size: meta.size },
  };
}

function normalizeTimeSeries(points, source) {
  return {
    id: `${source}:${Math.random().toString(36).slice(2, 8)}`,
    type: "time_series",
    source,
    context: { days: points.length },
    payload: points,
  };
}

function normalizeText(snippet, source) {
  const text = snippet.text.trim();
  const tokens = text.split(/\s+/).filter(Boolean);
  return {
    id: `${source}:${Math.random().toString(36).slice(2, 8)}`,
    type: "text",
    source,
    context: { file: snippet.file, tokens: tokens.length },
    payload: { text },
  };
}

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const samplesDir = path.join(dataDir, "samples");
  ensureDir(dataDir);
  ensureDir(samplesDir);

  // Load sample sources
  const csvPath = path.join(samplesDir, "orders.csv");
  const jsonPath = path.join(samplesDir, "requests.json");
  const hasCSV = fs.existsSync(csvPath);
  const hasJSON = fs.existsSync(jsonPath);
  if (!hasCSV) {
    fs.writeFileSync(
      csvPath,
      [
        "order_id,amount,currency,status,category",
        "O-001,1250.50,TRY,completed,Electronics",
        "O-002,300.00,USD,pending,Office",
        "O-003,0,EUR,canceled,Other",
      ].join("\n"),
      "utf8"
    );
  }
  if (!hasJSON) {
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        [
          { request_id: "R-101", priority: "High", status: "pending", department: "IT" },
          { request_id: "R-102", priority: "Low", status: "completed", department: "HR" },
          { request_id: "R-103", priority: "Medium", status: "canceled", department: "Finance" },
        ],
        null,
        2
      ),
      "utf8"
    );
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const csvRecords = parseCSV(csvText).map(cleanRecord).map((r) => normalizeNumeric(r, "orders.csv"));

  const jsonRecordsRaw = readJSON(jsonPath);
  const jsonRecords = jsonRecordsRaw.map(cleanRecord).map((r) => normalizeCategorical(r, "requests.json"));

  const images = listImages(path.join(process.cwd(), "public"));
  const imageRecords = images.map((m) => normalizeImage(m, "public"));

  const tsPoints = generateTimeSeries(30);
  const tsRecord = normalizeTimeSeries(tsPoints, "synthetic:timeseries");

  const snippets = readTextSnippets(path.join(process.cwd(), "docs"));
  const textRecords = snippets.map((s) => normalizeText(s, "docs"));

  const all = [...csvRecords, ...jsonRecords, ...imageRecords, tsRecord, ...textRecords];

  // Write JSONL
  const outPath = path.join(dataDir, "dataset.jsonl");
  const out = all.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.writeFileSync(outPath, out, "utf8");

  // Summary metadata
  const summary = {
    total: all.length,
    byType: all.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {}),
    sources: Array.from(new Set(all.map((r) => r.source))).sort(),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dataDir, "metadata.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log("Dataset generated:");
  console.log(" -", outPath);
  console.log(" -", path.join(dataDir, "metadata.json"));
  console.log("Types:", summary.byType);
}

main();