import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <svg width="120" height="120" viewBox="0 0 512 512">
          <path d="M296 64 144 288h88l-32 160 168-240h-92l20-144z" fill="#fbbf24" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
