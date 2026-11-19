import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily To-Do",
    short_name: "To-Do", // the label under the icon
    description: "A simple daily to-do list",
    start_url: "/",
    display: "standalone", // no browser bar
    background_color: "#f6f5f1", // splash screen
    theme_color: "#f6f5f1", // status bar
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // the same image again as "maskable": Android may crop it into a circle or squircle
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}