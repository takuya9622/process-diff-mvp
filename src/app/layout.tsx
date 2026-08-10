import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Diff — 業務知識を理解し、安全に変更",
  description:
    "組織の業務知識を一か所で理解し、必要なときは差分と影響候補を確認しながら安全に変更できるワークスペース",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
