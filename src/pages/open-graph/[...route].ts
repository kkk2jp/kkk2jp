import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import { getCategoryColor, getCategoryLabel, hexToRgb, SITE_TITLE } from '../../consts';

const posts = await getCollection('blog');

// ルートのキー = 記事ID（{category}/{slug}）。値に描画に必要な情報を持たせる
const pages = Object.fromEntries(
	posts.map((post) => [
		post.id,
		{ title: post.data.title, category: post.data.category },
	]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	// 出力パス: /open-graph/{category}/{slug}.png
	getSlug: (path) => `${path}.png`,
	getImageOptions: (_path, page) => {
		const accent = hexToRgb(getCategoryColor(page.category));
		return {
			title: page.title,
			description: `${getCategoryLabel(page.category)}   ·   ${SITE_TITLE}`,
			// しめじマーク（カード上部に表示）
			logo: {
				path: './src/assets/shimeji-mark.png',
				size: [48],
			},
			// 白ベースのごく淡いグラデーション
			bgGradient: [
				[255, 255, 255],
				[245, 246, 248],
			],
			// カテゴリカラーの左アクセントバー
			border: {
				color: accent,
				width: 24,
				side: 'inline-start',
			},
			padding: 70,
			font: {
				title: {
					color: [24, 24, 27],
					weight: 'Bold',
					size: 56,
					lineHeight: 1.32,
					families: ['Noto Sans JP'],
				},
				// サブテキストはカテゴリカラーで軽くアクセント
				description: {
					color: accent,
					weight: 'Bold',
					size: 30,
					families: ['Noto Sans JP'],
				},
			},
			fonts: ['./src/assets/og-fonts/NotoSansJP.ttf'],
		};
	},
});
