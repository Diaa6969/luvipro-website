export const dynamic = "force-dynamic";

export default function PaymentSuccessPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <p style={{ fontSize: 14, opacity: 0.7 }}>LUVIPRO Zahlung</p>

      <h1>Zahlung erfolgreich</h1>

      <p>
        Vielen Dank. Ihre Zahlung wurde erfolgreich verarbeitet. Der Bericht
        wird jetzt in Ihrem LUVIPRO Profil freigeschaltet.
      </p>

      <a
        href="luvipro://luvipro.de/purchases"
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
        LUVIPRO App öffnen
      </a>
    </main>
  );
}
