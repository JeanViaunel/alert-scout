import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import vm from "node:vm";

export const runtime = "nodejs";

type NuxtPayload = { pinia?: Record<string, unknown> };

function parseNuxtPayloadFromHtml(html: string): NuxtPayload | null {
  const scriptStart = html.indexOf("<script>window.__NUXT__=");
  if (scriptStart === -1) return null;
  const scriptEnd = html.indexOf("</script>", scriptStart);
  if (scriptEnd === -1) return null;

  const scriptContent = html
    .slice(scriptStart + "<script>".length, scriptEnd)
    .trim();
  const code = scriptContent.replace(/^window\.__NUXT__\s*=\s*/, "");
  if (!code) return null;

  try {
    const ctx = { window: {} as { __NUXT__?: NuxtPayload } };
    vm.createContext(ctx);
    vm.runInContext("window.__NUXT__ = " + code, ctx, { timeout: 1000 });
    return ctx.window.__NUXT__ ?? null;
  } catch {
    return null;
  }
}

function pickActiveFacilityNames(service: unknown): string[] {
  if (!service || typeof service !== "object") return [];
  const facility = (service as any).facility;
  if (!Array.isArray(facility)) return [];
  return facility
    .filter(
      (f: any) =>
        f && typeof f === "object" && f.active === 1 && typeof f.name === "string",
    )
    .map((f: any) => f.name as string);
}

function mapDetailToMetadata(detailCtx: Record<string, unknown> | undefined) {
  if (!detailCtx) return null;

  const depositText =
    typeof detailCtx.deposit === "string"
      ? (detailCtx.deposit as string)
      : undefined;

  const tags = Array.isArray(detailCtx.tags)
    ? (detailCtx.tags as any[])
        .map((t) => (t && typeof t === "object" ? (t as any).value : undefined))
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];

  const info = Array.isArray(detailCtx.info)
    ? (detailCtx.info as any[])
        .filter((i) => i && typeof i === "object")
        .map((i) => ({
          name: typeof i.name === "string" ? i.name : "",
          value: typeof i.value === "string" ? i.value : "",
          key: typeof i.key === "string" ? i.key : "",
        }))
        .filter((i) => i.name && i.value)
    : [];

  const infoByKey: Record<string, string> = {};
  for (const row of info) {
    if (row.key) infoByKey[row.key] = row.value;
  }

  const positionRound =
    detailCtx.positionRound && typeof detailCtx.positionRound === "object"
      ? {
          communityName:
            typeof (detailCtx.positionRound as any).communityName === "string"
              ? (detailCtx.positionRound as any).communityName
              : "",
          address:
            typeof (detailCtx.positionRound as any).address === "string"
              ? (detailCtx.positionRound as any).address
              : "",
          lat:
            typeof (detailCtx.positionRound as any).lat === "string"
              ? (detailCtx.positionRound as any).lat
              : undefined,
          lng:
            typeof (detailCtx.positionRound as any).lng === "string"
              ? (detailCtx.positionRound as any).lng
              : undefined,
          data: Array.isArray((detailCtx.positionRound as any).data)
            ? (detailCtx.positionRound as any).data
            : [],
        }
      : null;

  const service =
    detailCtx.service && typeof detailCtx.service === "object"
      ? {
          desc:
            typeof (detailCtx.service as any).desc === "string"
              ? (detailCtx.service as any).desc
              : "",
          rule:
            typeof (detailCtx.service as any).rule === "string"
              ? (detailCtx.service as any).rule
              : "",
          facilities: pickActiveFacilityNames(detailCtx.service),
        }
      : null;

  const remarkHtml =
    detailCtx.remark &&
    typeof detailCtx.remark === "object" &&
    typeof (detailCtx.remark as any).content === "string"
      ? ((detailCtx.remark as any).content as string)
      : undefined;

  const owner =
    detailCtx.linkInfo && typeof detailCtx.linkInfo === "object"
      ? {
          name:
            typeof (detailCtx.linkInfo as any).name === "string"
              ? (detailCtx.linkInfo as any).name
              : "",
          roleTxt:
            typeof (detailCtx.linkInfo as any).roleTxt === "string"
              ? (detailCtx.linkInfo as any).roleTxt
              : "",
          mobile:
            typeof (detailCtx.linkInfo as any).mobile === "string"
              ? (detailCtx.linkInfo as any).mobile
              : "",
          phone:
            typeof (detailCtx.linkInfo as any).phone === "string"
              ? (detailCtx.linkInfo as any).phone
              : "",
          line:
            typeof (detailCtx.linkInfo as any).line === "string"
              ? (detailCtx.linkInfo as any).line
              : "",
          labels: Array.isArray((detailCtx.linkInfo as any).labelInfo)
            ? (detailCtx.linkInfo as any).labelInfo.filter(
                (s: any) => typeof s === "string",
              )
            : [],
        }
      : null;

  const publish =
    detailCtx.publish && typeof detailCtx.publish === "object"
      ? {
          postTime:
            typeof (detailCtx.publish as any).postTime === "string"
              ? (detailCtx.publish as any).postTime
              : "",
          updateTime:
            typeof (detailCtx.publish as any).updateTime === "string"
              ? (detailCtx.publish as any).updateTime
              : "",
        }
      : null;

  return {
    depositText,
    tags,
    info,
    infoByKey,
    positionRound,
    service,
    remarkHtml,
    owner,
    publish,
  };
}

function extractAlbumPhotos(nuxt: NuxtPayload | null): string[] {
  const albumData = (nuxt?.pinia as any)?.album?.albumData;
  const items = albumData?.items;
  if (!Array.isArray(items)) return [];

  const photos = items
    .map((it: any) => {
      const orig = typeof it?.origPhoto === "string" ? it.origPhoto : "";
      const photo = typeof it?.photo === "string" ? it.photo : "";
      return orig || photo;
    })
    .filter((u: any): u is string => typeof u === "string" && u.startsWith("http"));

  return Array.from(new Set(photos));
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    if (parsed.hostname !== "rent.591.com.tw") {
      return NextResponse.json({ error: "Unsupported host" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }
    const html = await res.text();

    const nuxt = parseNuxtPayloadFromHtml(html);
    const store = (nuxt?.pinia as any)?.["rent-detail-info"] as
      | { ctx?: Record<string, unknown> }
      | undefined;
    const rentDetail = mapDetailToMetadata(store?.ctx);
    const photoList = extractAlbumPhotos(nuxt);

    return NextResponse.json({
      rentDetail,
      photoList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

