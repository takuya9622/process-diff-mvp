# CSSコーディング規約

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 初期決定 |
| 対象 | Tailwind CSS、CSS変数、CSS Modules、Motionとの境界 |
| 最終更新日 | 2026-08-09 |

この文書は、[共通コーディング規約](README.md)を前提として、色、theme token、utility class、
global CSS、局所CSSの責務を定義します。Tailwind CSSとMotionの採用理由は
[MVP技術選定](../README.md)を参照してください。

## 2. 基本方針

- Componentの見た目はTailwind CSSのutility classを基本とする。
- 色、font、余白など複数箇所で同じ意味を持つ値はtheme tokenで管理する。
- `globals.css`はTailwindの読み込み、theme token、最低限のbase styleに限定する。
- page固有のstyleをglobal selectorへ追加しない。
- CSSだけでは表現しにくい意味のある状態遷移はMotionへ任せ、同じ要素の同じpropertyを
  CSSとMotionの両方から更新しない。

## 3. 色

Component、TSX、CSS Modulesへカラーコードを直接記載しません。実際の色値はtheme tokenの
定義場所だけに置き、Componentはセマンティックな名前から参照します。

Tailwind CSS 4では、`@theme`の`--color-*`変数からutility classを生成します。色の追加と
参照方法は[公式のColors](https://tailwindcss.com/docs/colors)と
[Theme variables](https://tailwindcss.com/docs/theme)を基準とします。

```css
@import "tailwindcss";

@theme {
  --color-canvas: oklch(...);
  --color-surface: oklch(...);
  --color-surface-muted: oklch(...);
  --color-content-primary: oklch(...);
  --color-content-secondary: oklch(...);
  --color-outline: oklch(...);
  --color-action-primary: oklch(...);
  --color-action-primary-hover: oklch(...);
  --color-focus-ring: oklch(...);
  --color-status-danger: oklch(...);
}
```

この定義から、`bg-canvas`、`text-content-primary`、`border-outline`などの完全なclassを
使用します。実際のtoken名は、画面のデザインsystemを決めるときに確定します。

### 3.1 命名

- `blue-500`、`slate-100`のような色相や濃度ではなく、`canvas`、`content-primary`、
  `outline`、`action-primary`のように用途で命名する。
- `header-blue`、`entity-card-gray`のような特定Componentと色を結合した名前を避ける。
- 通常、hover、active、disabled、focusなど、見た目を変える必要がある状態は別tokenとして
  意味を明示する。
- success、warning、dangerなどの状態色は、背景、文字、borderが異なる場合に役割を分ける。
- 差分の追加と削除などプロダクト固有の意味が複数箇所で共通する場合は、
  `change-added`、`change-removed`のようなsemantic tokenを追加できる。

### 3.2 使用規則

- `#ffffff`、`rgb(...)`、`hsl(...)`、`oklch(...)`などの直接指定はtoken定義以外で使わない。
- `bg-[#123456]`のようなarbitrary color utilityを使わない。
- Tailwindの標準palette classを、アプリケーションUIへ直接使わない。採用する色はsemantic
  tokenを経由する。
- inline styleへ色を記載しない。外部libraryへ実色を渡す必要がある場合は、CSS変数から
  取得できるadapterへ集約する。
- 色だけで、差分、警告、選択状態、操作可否を区別しない。文字、icon、border、形状などを
  併用する。
- tokenを追加するときは既存tokenで表現できない意味があるかを確認し、同じ実色でも意味が
  異なる場合は別tokenとして扱えるようにする。

## 4. Tailwind utility class

- layout、spacing、typography、responsive、interaction stateは、既存のutilityを優先する。
- Tailwindがsourceを文字列として検出できるよう、class名はコード上に完全な文字列で記載する。
- `bg-${color}-500`のようにclass名の一部を動的に組み立てない。状態やPropsから切り替える場合は、
  完全なclass文字列への対応表を定数として定義する。
- 同じclass群が複数箇所で同じUI責務を表す場合は、global classや文字列定数より先に、
  `components/general`のComponentとして共通化を検討する。
- Component固有のclass対応表はmodule scope、複数Componentで共有する対応表は
  `src/constants`の適切な責務へ置く。
- utilityの並び順はFormatterへ任せ、規約やレビューで手作業の順序を要求しない。

Tailwindの動的classに関する制約は
[公式のDetecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
を基準とします。

## 5. arbitrary valueとtheme token

- 色のarbitrary valueは禁止する。
- spacing、size、gridなどのarbitrary valueは、既存scaleで要件を表現できず、一つの
  Componentに閉じる場合だけ使用する。
- 同じarbitrary valueを複数箇所で使用する場合、またはデザイン上の意味を持つ場合は、
  theme tokenまたはComponentへ昇格する。
- デザインカンプの数値をそのまま大量に転記せず、近い既存scaleで一貫性を保てるかを確認する。
- z-indexは必要な重なり順を最小限にし、理由なく大きな数値を追加しない。複数箇所で同じ
  レイヤー概念を使う場合は定数またはtokenとして管理する。

## 6. `globals.css`と局所CSS

`globals.css`へ置いてよいものは次に限定します。

- `@import "tailwindcss"`
- theme token
- `html`、`body`などアプリケーション全体のbase style
- font変数との接続
- browser defaultを補正する、全体で必要な最小限のstyle

複雑なselector、pseudo-element、第三者Componentの上書きなどutilityだけでは理解しにくい
場合は、対象Componentと同じディレクトリへCSS Moduleを置きます。

- CSS Moduleのselectorは対象Component内へ閉じ、外部のDOM構造へ依存しない。
- ID selector、深い子孫selector、過度なnestingでspecificityを上げない。
- `!important`は原則として使わない。第三者styleを制御するため避けられない場合だけ、
  共通規約に従って理由をコメントする。
- `@apply`でTailwindとは別のComponent class体系を作らない。再利用するUIはReact Componentで
  表現する。
- page固有のselectorを`globals.css`へ置かず、page ComponentまたはCSS Moduleへ閉じる。

## 7. Responsive layout

- 小さいviewportを基準にし、内容が崩れる地点でresponsive variantを追加する。
- `mobile`、`tablet`、`desktop`という端末名だけでbreakpointを選ばず、layoutの変化で判断する。
- 固定幅を前提にせず、利用可能な幅、文字量、拡大表示に追従できるlayoutを優先する。
- hoverだけに操作や情報を隠さず、keyboard focusとtouchでも同じ内容へ到達できるようにする。
- MVPの必須対象はdesktopですが、狭い画面で操作不能になる実装は避ける。

## 8. 状態、focus、animation

- `hover`、`focus-visible`、`disabled`、`aria-*`、`data-*`を、Componentの意味と一致する状態表現に
  使用する。
- browserのfocus outlineを無効にする場合は、同等以上に明確な`focus-visible`表現を用意する。
- disabledを見た目だけで表現せず、HTML属性と操作不能状態を一致させる。
- CSS transitionはhoverや開閉など単純な変化に使い、複数要素の順序や影響経路を示す動きは
  Motionを使う。
- `prefers-reduced-motion`を尊重し、animationを減らしても情報が失われないようにする。
- `transform`など同じpropertyをTailwind CSSとMotionの双方から同時に制御しない。必要な場合は
  wrapperを分ける。

## 9. コメント

CSSのコメントも[共通コーディング規約](README.md)に従います。selectorやpropertyを読み替える
コメントは付けません。browser固有の回避策、第三者styleとの互換性、通常と異なる実装を
残す理由など、CSSだけでは意図が伝わらない場合に限定します。

## 10. レビュー時の確認

- カラーコードとpalette classがsemantic tokenを経由しているか。
- token名が実色やComponent名ではなく、UI上の役割を表しているか。
- 動的に組み立てたTailwind classがないか。
- `globals.css`へpage固有またはComponent固有のstyleが漏れていないか。
- arbitrary valueが繰り返され、token化すべき状態になっていないか。
- 色、hover、animationだけに依存せず、keyboardとreduced motionでも意味が伝わるか。
