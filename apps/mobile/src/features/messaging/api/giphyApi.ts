import type { GifItem, StickerItem } from "../constants/richMedia";

type GiphyAsset = {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string };
    downsized_medium?: { url: string };
    original: { url: string };
  };
};

type GiphyResponse = {
  data?: GiphyAsset[];
};

export function getGiphyApiKey() {
  return process.env.EXPO_PUBLIC_GIPHY_API_KEY;
}

function mapGiphyAsset(asset: GiphyAsset): GifItem {
  return {
    id: asset.id,
    title: asset.title || "GIF",
    previewUrl: asset.images.fixed_height_small.url,
    url: asset.images.downsized_medium?.url ?? asset.images.original.url,
  };
}

function mapGiphySticker(asset: GiphyAsset): StickerItem {
  return {
    id: asset.id,
    label: asset.title || "Sticker",
    previewUrl: asset.images.fixed_height_small.url,
    url: asset.images.downsized_medium?.url ?? asset.images.original.url,
  };
}

async function giphyGet(endpoint: string, params: Record<string, string> = {}): Promise<GiphyAsset[]> {
  const apiKey = getGiphyApiKey();
  if (!apiKey) return [];

  const qs = new URLSearchParams({
    ...params,
    api_key: apiKey,
    limit: "24",
    rating: "pg",
  });

  const response = await fetch(`https://api.giphy.com/v1/${endpoint}?${qs.toString()}`);
  if (!response.ok) return [];

  const payload = (await response.json()) as GiphyResponse;
  return payload.data ?? [];
}

export async function fetchGiphyGifs(query: string): Promise<GifItem[]> {
  const assets = query.trim()
    ? await giphyGet("gifs/search", { q: query.trim() })
    : await giphyGet("gifs/trending");
  return assets.map(mapGiphyAsset);
}

export async function fetchGiphyStickers(query: string): Promise<StickerItem[]> {
  const assets = query.trim()
    ? await giphyGet("stickers/search", { q: query.trim() })
    : await giphyGet("stickers/trending");
  return assets.map(mapGiphySticker);
}
