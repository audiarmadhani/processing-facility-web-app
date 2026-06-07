import * as React from "react";

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
      }}
    >
      {children}
    </div>
  );
}
