// FRONTEND/src/utils/supabaseUpload.js
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const SUPABASE_URL = "https://ombvnpeoietugpxelugs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnZucGVvaWV0dWdweGVsdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODM2ODYsImV4cCI6MjA2NzU1OTY4Nn0.mv9NsqrC2tckMmHa2w0X8Vg0fGtjsQXYYbMG1LRy9K4";
const BUCKET = "cropcartimages";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const buildIncidencePath = (fileName) => `incidences/${fileName}`;
const buildFieldPath = (fileName) => `fields/${fileName}`;

export const uploadToSupabase = async (file) => {
  if (!file) throw new Error("No file selected");
  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("File size must be less than 5MB");

  const timeStamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "-");
  const filePath = buildIncidencePath(`${timeStamp}-${safeName}`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(error.message || "Upload failed");
  }

  const { data, error: urlError } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  if (urlError || !data?.publicUrl) {
    console.error("Failed to get public URL:", urlError);
    throw new Error("Failed to get public URL");
  }

  return data.publicUrl;
};

export async function uploadFieldImage(file) {
  if (!file) throw new Error("No file provided");

  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const fileName = `${timestamp}-${safeName}`;
  const path = buildFieldPath(fileName);

  const uploadPromise = supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream" });

  const { data } = await toast.promise(
    uploadPromise.then((result) => {
      if (result.error) throw result.error;
      return result;
    }),
    {
      loading: `Uploading ${file.name}...`,
      success: `Uploaded ${file.name}`,
      error: `Failed to upload ${file.name}`,
    }
  );

  if (!data?.path) {
    throw new Error("Upload succeeded but no path returned");
  }

  const { data: urlData, error: urlError } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  if (urlError || !urlData?.publicUrl) {
    console.error("Failed to get public URL for field image:", urlError);
    throw urlError || new Error("Failed to get public URL");
  }

  return { url: urlData.publicUrl, path };
}

export function deriveStoragePath(url) {
  if (!url || typeof url !== "string") return "";
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefix)) {
    const bucketSegment = `/${BUCKET}/`;
    const idx = url.indexOf(bucketSegment);
    if (idx === -1) return "";
    return decodeURIComponent(url.slice(idx + bucketSegment.length));
  }
  return decodeURIComponent(url.slice(prefix.length));
}

export const deleteFromSupabase = async (fileUrl) => {
  try {
    let storagePath = deriveStoragePath(fileUrl);

    if (!storagePath) {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (!fileName) {
        console.error('Invalid file URL:', fileUrl);
        return false;
      }
      storagePath = buildIncidencePath(fileName);
    }

    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    console.log('Successfully deleted file from Supabase:', storagePath);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};
