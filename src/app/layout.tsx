import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Diff — 業務知識を理解し、安全に変更",
  description:
    "業務を起点にルール、文書、システム、担当を理解し、必要なときは差分と影響候補を確認しながら安全に変更できるワークスペース",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
