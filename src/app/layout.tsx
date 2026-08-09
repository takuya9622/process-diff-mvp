import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Diff — 業務変更の影響候補を確認",
  description:
    "組織の業務要素の変更前後と、確認が必要な関連項目を一つの流れで把握するワークスペース",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
