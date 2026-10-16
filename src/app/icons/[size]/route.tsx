import { ImageResponse } from "next/og";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await params;
  const isMaskable = rawSize.startsWith("maskable-");
  const numeric = Number(rawSize.replace("maskable-", "")) || 512;
  const dimension = numeric === 192 ? 192 : 512;
  const boltSize = isMaskable ? Math.round(dimension * 0.56) : Math.round(dimension * 0.72);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: isMaskable ? 0 : Math.round(dimension * 0.18),
        }}
      >
        <svg width={boltSize} height={boltSize} viewBox="0 0 512 512">
          <path d="M296 64 144 288h88l-32 160 168-240h-92l20-144z" fill="#fbbf24" />
        </svg>
      </div>
    ),
    {
      width: dimension,
      height: dimension,
    }
  );
}
