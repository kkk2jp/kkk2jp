---
title: 'Cloudflare Pagesのpages.devをBulk Redirectsでリダイレクトする'
description: 'Page Rulesでは対応できない*.pages.devのリダイレクトを、Bulk Redirectsで設定する手順とpreview URLを守るための注意点をまとめました。'
pubDate: '2026-06-20'
heroImage: '../../../assets/blog-placeholder-5.jpg'
category: 'cloudflare'
---

## 背景 — `*.pages.dev` は独自ドメインを設定しても残り続ける

Cloudflare Pagesで独自ドメインを設定しても、自動生成される `<project>.pages.dev` というURLは**有効なまま残り続けます**。同じコンテンツが2つのURLで公開され、検索エンジンがページランクを分散させるリスクがあります。

対処としては `pages.dev` へのアクセスをカスタムドメインへ301リダイレクトするのが定石ですが、ひとつ制約があります。`<hash>.myproject.pages.dev` のようなサブドメイン形式の**preview URL**はCloudflare Accessで保護した確認用環境として使っているケースが多く、そちらは生かしたまま本番URL（`myproject.pages.dev`）だけをリダイレクトしたい、という要件です。

## 解決策の検討 — 3つのアプローチ

### 方法A: Pages Functions（`_middleware.js`）でリダイレクト

ミドルウェアでホスト名を完全一致させてリダイレクトします。

```javascript
// functions/_middleware.js
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'myproject.pages.dev') {
    return Response.redirect(`https://example.com${url.pathname}${url.search}`, 301);
  }
  return next();
}
```

preview URLは`===`で弾けるので要件は満たせますが、Pages Functionsの実行はCloudflare Workersの枠（無料プランはアカウント全体で1日10万リクエスト）を消費します。複数プロジェクトで共有している場合、リダイレクト程度の処理に使うのは避けたいところです。

### 方法B: Page Rules / Redirect Rules（不可）

一見できそうに見えますが**不可能です**。Page RulesやRedirect Rulesは**ゾーン単位**の機能であり、マッチ対象のホスト名は自分がCloudflareに委任したゾーン（例: `example.com`）でなければなりません。`myproject.pages.dev`はCloudflareが所有する`pages.dev`ゾーンの一部なので、そもそもルールの対象に指定できません。

「ダッシュボードで`pages.dev`を入力しようとしたら弾かれた」という体験は、まさにこの制約です。ここが最大のハマりポイントです。

### 方法C: Bulk Redirects（採用）

**Bulk Redirectsはアカウントレベルの機能**です。特定のゾーンに縛られないため`pages.dev`のURLも対象にでき、処理はCloudflareのエッジで静的に行われるためWorkersの実行枠も消費しません。

| 方法 | pages.devを対象にできる | Workers枠を消費しない |
|---|---|---|
| A: Pages Functions | ✅ | ❌ |
| B: Page Rules / Redirect Rules | ❌ | ✅ |
| C: Bulk Redirects | ✅ | ✅ |

## Bulk Redirectsの設定手順

### 1. Redirect Listを作成する

Cloudflareダッシュボードの**アカウントホーム**（ゾーンではなくアカウントのトップ）から「Bulk Redirects」を開き、新しいリストを作成します。

| 項目 | 値 |
|---|---|
| Source URL | `myproject.pages.dev/` |
| Target URL | `https://example.com/` |
| Status | 301 |

### 2. 4つのオプション設定

| オプション | 推奨設定 | 理由 |
|---|---|---|
| クエリ文字列を保存する | **ON** | UTMパラメータ等を引き継ぐ |
| **サブドメインを含める** | **OFF** | ONにするとpreview URLもリダイレクト対象になる |
| サブパスの一致 | **ON** | トップ以外のパスもルール対象にする（入口） |
| パスサフィックスを保持する | **ON** | マッチしたパスを転送先にも引き継ぐ（出口） |

「サブパスの一致」と「パスサフィックスを保持する」はセットで使います。前者が「どのURLをルール対象にするか（入口）」、後者が「マッチしたパスを転送先に渡すか（出口）」の設定です。両方ONにすると `myproject.pages.dev/about` が `example.com/about` に転送されます。片方だけONだとトップページに飛ばされます。

最も注意すべきは**「サブドメインを含める」をOFFにすること**です。ONにすると`<hash>.myproject.pages.dev`（preview URL）まで巻き込まれ、確認用環境として使えなくなります。

### 3. Bulk Redirect Ruleを作成して有効化する

**ここが落とし穴です。リストを作っただけでは機能しません。**

リストを有効化するには、別途**Bulk Redirect Rule**を作成してリストを紐付ける必要があります。「Create Bulk Redirect Rule」から次のように設定してください。

- **If**: `true`（全リクエストに適用。実際のリダイレクト判定はリストのエントリが担う）
- **Then**: 作成したRedirect Listを選択

Ruleを保存するとリストがアクティブになり、リダイレクトが機能します。

## 余談：末尾スラッシュは気にしなくていい

Source URLに`myproject.pages.dev/`と末尾`/`を付けていますが、ユーザーが`/`なしでアクセスしても問題ありません。ブラウザはHTTPリクエスト送信時にパスが空の場合`/`を自動補完するため、実際にサーバーへ届くリクエストは常に`/`付きになります。

## まとめ

Page RulesやRedirect Rulesは「ゾーン単位」の機能で、自分のゾーンに属さない`pages.dev`は対象にできません。「アカウント単位」で動くBulk Redirectsを使うのが正解です。設定時は**「サブドメインを含める」をOFF**にしてpreview URLを守ることと、**リスト作成後にRuleで有効化する**という2点を忘れずに。

Cloudflare Rulesエコシステムは「ゾーン単位か、アカウント単位か」の違いを把握していないと今回のようにハマります。機能を選ぶ前に「自分が制御できるのはどのスコープか」を確認する習慣が大切です。
