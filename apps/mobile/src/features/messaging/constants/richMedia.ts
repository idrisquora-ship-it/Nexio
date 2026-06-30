export type StickerItem = {
  id: string;
  label: string;
  previewUrl: string;
  url: string;
};

export type GifItem = {
  id: string;
  previewUrl: string;
  url: string;
  title: string;
};

/** Curated GIFs when no Giphy API key is configured */
export const FALLBACK_GIFS: GifItem[] = [
  {
    id: "celebrate",
    title: "Celebrate",
    previewUrl: "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy-preview.gif",
    url: "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
  },
  {
    id: "thumbs-up",
    title: "Thumbs up",
    previewUrl: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy-preview.gif",
    url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  },
  {
    id: "hello",
    title: "Hello",
    previewUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy-preview.gif",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    id: "nice",
    title: "Nice",
    previewUrl: "https://media.giphy.com/media/3o7TKMt1VVNkFV2O4U/giphy-preview.gif",
    url: "https://media.giphy.com/media/3o7TKMt1VVNkFV2O4U/giphy.gif",
  },
  {
    id: "wow",
    title: "Wow",
    previewUrl: "https://media.giphy.com/media/5VKbvrjxpVJCMaN7fK/giphy-preview.gif",
    url: "https://media.giphy.com/media/5VKbvrjxpVJCMaN7fK/giphy.gif",
  },
  {
    id: "deal",
    title: "Deal",
    previewUrl: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy-preview.gif",
    url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
  },
];
