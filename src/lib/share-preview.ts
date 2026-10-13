import homepagePreview from "@/assets/share-homepage.jpg.asset.json";

const imageUrl = `https://sahihaladhkar.com${homepagePreview.url}`;

// A stable, public URL lets messaging apps fetch the image without JavaScript.
export const homepageShareImageMeta = [
  { property: "og:image", content: imageUrl },
  { property: "og:image:secure_url", content: imageUrl },
  { property: "og:image:type", content: "image/jpeg" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: "Sahih Al-Adhkar homepage with sunrise scenery and current app screens" },
  { name: "twitter:image", content: imageUrl },
  { name: "twitter:image:alt", content: "Sahih Al-Adhkar homepage with sunrise scenery and current app screens" },
];