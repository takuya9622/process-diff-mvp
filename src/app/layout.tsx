import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Diff MVP",
  description: "業務の変更履歴と影響関係を可視化するMVP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
