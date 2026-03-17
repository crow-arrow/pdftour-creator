import { NextResponse } from "next/server";
import { writeFile, mkdir, readdir, readFile, unlink } from "fs/promises";
import path from "path";
import type { TourBuilderState } from "@/lib/pdf-builder/types";

export const runtime = "nodejs";

const DRAFTS_DIR = path.join(process.cwd(), "data", "pdf-builder");

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_а-яА-ЯёЁ]+/g, "-").slice(0, 80);
}

type ServerDraft = { filename: string; name: string; createdAt: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (filename) {
    const safe = path.basename(filename).replace(/[^a-zA-Z0-9_.-]+/g, "");
    if (!safe || !safe.endsWith(".json")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const filePath = path.join(DRAFTS_DIR, safe);
    try {
      const content = await readFile(filePath, "utf-8");
      const config = JSON.parse(content) as { state?: TourBuilderState };
      if (!config?.state) {
        return NextResponse.json({ error: "Invalid config" }, { status: 400 });
      }
      return NextResponse.json({ state: config.state });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  try {
    await mkdir(DRAFTS_DIR, { recursive: true });
    const files = await readdir(DRAFTS_DIR);
    const list: ServerDraft[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const content = await readFile(path.join(DRAFTS_DIR, f), "utf-8");
        const parsed = JSON.parse(content) as { name?: string; createdAt?: string };
        list.push({
          filename: f,
          name: parsed.name ?? f.replace(/\.json$/, ""),
          createdAt: parsed.createdAt ?? ""
        });
      } catch {
        list.push({ filename: f, name: f.replace(/\.json$/, ""), createdAt: "" });
      }
    }
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return NextResponse.json({ drafts: list });
  } catch {
    return NextResponse.json({ drafts: [] });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    name: string;
    createdAt: string;
    state: TourBuilderState;
  };

  if (!body?.state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  await mkdir(DRAFTS_DIR, { recursive: true });

  const baseName = safeFilename(body.name || "draft") || "draft";
  const filename = `${baseName}-${body.id}.json`;
  const filePath = path.join(DRAFTS_DIR, filename);

  const config = {
    version: 1,
    name: body.name,
    createdAt: body.createdAt,
    state: body.state
  };

  try {
    await writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");
    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error("Draft save error:", err);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9_.-]+/g, "");
  if (!safe || !safe.endsWith(".json")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const filePath = path.join(DRAFTS_DIR, safe);
  try {
    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
