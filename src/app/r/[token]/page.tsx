import Link from "next/link";
export const dynamic = "force-dynamic";

type PreviewRow = {
  inspection_id: string;
  vin: string | null;
  brand: string | null;
  modell: string | null;
  created_at: string | null;
};

async function getInspectionPreview(token: string): Promise<PreviewRow | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/get_public_inspection_preview`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_token: token,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("Supabase RPC error:", await response.text());
    throw new Error("Could not load inspection preview");
  }

  const data = (await response.json()) as PreviewRow[];

  return data.length > 0 ? data[0] : null;
}

export default async function ReportPreviewPage({
  params,
}: {
  params: { token: string } | Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  const preview = await getInspectionPreview(token);

  if (!preview) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Bericht nicht gefunden</h1>
        <p>Der QR-Code ist ungültig oder der Bericht ist nicht mehr aktiv.</p>
        <Link href="/">Zur Startseite</Link>
      </main>
    );
  }

  const vehicleName =
    [preview.brand, preview.modell].filter(Boolean).join(" ") ||
    "Fahrzeugbericht";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
      <p style={{ fontSize: 14, opacity: 0.7 }}>LUVIPRO Prüfbericht</p>

      <h1>{vehicleName}</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <p>
          <strong>FIN / VIN:</strong> {preview.vin || "Nicht angegeben"}
        </p>

        <p>
          <strong>Brand:</strong> {preview.brand || "Nicht angegeben"}
        </p>

        <p>
          <strong>Modell:</strong> {preview.modell || "Nicht angegeben"}
        </p>

        <p>
          <strong>Prüfdatum:</strong>{" "}
          {preview.created_at
            ? new Date(preview.created_at).toLocaleDateString("de-DE")
            : "Nicht angegeben"}
        </p>
      </div>

      <p>
        Dies ist die öffentliche Vorschau des LUVIPRO Prüfberichts. Der vollständige Bericht wird erst nach dem Kauf freigeschaltet.
      </p>

      <a
        href={`https://app.luvipro.de/report-purchase?token=${encodeURIComponent(token)}`}
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "14px 22px",
          borderRadius: 12,
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Bericht kaufen
      </a>
    </main>
  );
}
