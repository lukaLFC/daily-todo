"use client";

import { useState, type ChangeEvent } from "react";
import { removeAvatar, uploadAvatar } from "@/app/settings/actions";
import styles from "@/styles/app.module.css";

// centre-crop to a square and shrink to 256 x 256, so uploads are tiny
async function toSquareJpeg(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the image"))), "image/jpeg", 0.85),
  );
}

export default function AvatarPicker({ avatarUrl, initial }: { avatarUrl: string | null; initial: string }) {
  const [busy, setBusy] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", await toSquareJpeg(file), "avatar.jpg");
      const result = await uploadAvatar(form);
      if (!result.ok) alert(result.message);
    } catch {
      alert("That file couldn't be read as an image.");
    }
    setBusy(false);
  }

  return (
    <>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.avatar} src={avatarUrl} alt="Your photo" />
      ) : (
        <div className={styles.avatar}>{initial}</div>
      )}
      <div className={styles.avatarActions}>
        <label className={styles.segBtn}>
          {busy ? "Uploading…" : "Change photo"}
          <input type="file" accept="image/*" hidden onChange={onPick} disabled={busy} />
        </label>
        {avatarUrl && (
          <form action={removeAvatar}>
            <button className={styles.segBtn}>Remove</button>
          </form>
        )}
      </div>
    </>
  );
}