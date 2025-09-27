// FRONTEND/src/utils/supabaseUpload.js
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with your credentials
const supabase = createClient(
  "https://ombvnpeoietugpxelugs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnZucGVvaWV0dWdweGVsdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODM2ODYsImV4cCI6MjA2NzU1OTY4Nn0.mv9NsqrC2tckMmHa2w0X8Vg0fGtjsQXYYbMG1LRy9K4"
);

export const uploadToSupabase = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file selected");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      reject("File size must be less than 5MB");
      return;
    }

    const timeStamp = new Date().getTime();
    const newFileName = `${timeStamp}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `incidences/${newFileName}`;

    supabase.storage
      .from('cropcartimages')  // Your bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
      .then((result) => {
        if (result.error) {
          console.error("Supabase upload error:", result.error);
          reject(`Upload failed: ${result.error.message}`);
          return;
        }

        // Get public URL
        const { data } = supabase.storage
          .from('cropcartimages')
          .getPublicUrl(filePath);

        if (data.publicUrl) {
          resolve(data.publicUrl);
        } else {
          reject("Failed to get public URL");
        }
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        reject("Error uploading image");
      });
  });
};

// Enhanced delete function with better error handling
export const deleteFromSupabase = async (fileUrl) => {
  try {
    // Extract file path from URL - more robust parsing
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName) {
      console.error('Invalid file URL:', fileUrl);
      return false;
    }

    const filePath = `incidences/${fileName}`;
    
    const { error } = await supabase.storage
      .from('cropcartimages')
      .remove([filePath]);
    
    if (error) {
      console.error('Supabase delete error:', error);
      // Don't reject - just return false so the main operation can continue
      return false;
    }
    
    console.log('Successfully deleted file from Supabase:', filePath);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};