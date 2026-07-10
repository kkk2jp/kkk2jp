export const SITE_TITLE = 'Shimeji Blog';
export const SITE_DESCRIPTION = '.NET/C#・BIツール・AIについて書くエンジニアブログ';

// ─────────────────────────────────────────────────────────────
// カテゴリ定義（単一の真実の源）
// カテゴリを追加する場合はここに1行足すだけで、一覧ページ・記事ページ・
// OGP画像まですべてに反映される。色のトーン違い（淡い背景など）は
// アクセント色(color)から color-mix() で自動生成する。
// ─────────────────────────────────────────────────────────────
export interface CategoryMeta {
	/** 表示名 */
	label: string;
	/** Material Symbols のアイコン名 */
	icon: string;
	/** アクセントカラー（HEX）。バッジ文字色・アイコン色・OGアクセントに使用 */
	color: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
	dotnet: { label: '.NET/C#', icon: 'code', color: '#512BD4' },
	bi: { label: 'BIツール', icon: 'bar_chart', color: '#0067B8' },
	ai: { label: 'AI', icon: 'smart_toy', color: '#0A7A5A' },
	cloudflare: { label: 'Cloudflare', icon: 'cloud', color: '#C96200' },
};

// 表示順は CATEGORIES の定義順に従う
export const CATEGORY_ORDER = Object.keys(CATEGORIES);

// 未定義カテゴリのフォールバック
const DEFAULT_ICON = 'article';
const DEFAULT_COLOR = '#3D3D3D';

export function getCategoryLabel(slug: string): string {
	return CATEGORIES[slug]?.label ?? slug;
}

export function getCategoryIcon(slug: string): string {
	return CATEGORIES[slug]?.icon ?? DEFAULT_ICON;
}

export function getCategoryColor(slug: string): string {
	return CATEGORIES[slug]?.color ?? DEFAULT_COLOR;
}

/** `#512BD4` → `[81, 43, 212]`（OGP画像生成で使用） */
export function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16),
	];
}
