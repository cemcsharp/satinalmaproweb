import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(_req: Request) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const metaPath = path.join(dataDir, "metadata.json");

    const metaText = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaText);

    // Shape a predictable response
    const payload = {
      total: Number(meta.total || 0),
      byType: meta.byType || {},
      sources: Array.isArray(meta.sources) ? meta.sources : [],
      generatedAt: String(meta.generatedAt || null),
    };

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Metadata not found";
    return NextResponse.json(
      {
        error: "dataset_metadata_unavailable",
        message,
      },
      { status: 404 }
    );
  }
}