// ImgBB Service with Client-Side Fallback Rotation

let currentKeyIndex = 0;
const getKeys = () => {
  const keysStr = process.env.NEXT_PUBLIC_IMGBB_API_KEYS || '';
  return keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

export async function uploadToImgbbWithProgress(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const keys = getKeys();
  if (keys.length === 0) {
    throw new Error('لا توجد مفاتيح ImgBB مكونة');
  }

  const formData = new FormData();
  formData.append('image', file);

  let startKeyIndex = currentKeyIndex;
  
  while (true) {
    try {
      const currentKey = keys[currentKeyIndex];
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${currentKey}`, true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success) {
                resolve(res.data.url);
              } else {
                reject(new Error(res.error?.message || 'Upload failed'));
              }
            } catch (err) {
              reject(new Error('Invalid response'));
            }
          } else {
             // Let it fall to catch block to rotate
             reject(new Error(`HTTP Error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });
    } catch (error) {
      console.warn(`ImgBB key ${keys[currentKeyIndex]} failed, trying next...`, error);
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      
      // If we've tried all keys and are back where we started, fail
      if (currentKeyIndex === startKeyIndex) {
        throw new Error('فشل الرفع: جميع الروابط مستهلكة أو معطلة.');
      }
    }
  }
}

export async function uploadMultipleWithProgress(
  files: File[],
  onProgress: (overallProgress: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  const totalFiles = files.length;
  let filesCompleted = 0;

  // Upload sequentially to avoid aggressive rate limiting from ImgBB
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    
    // We calculate a base progress from previously completed files
    const baseProgress = (filesCompleted / totalFiles) * 100;
    
    const url = await uploadToImgbbWithProgress(file, (fileProgress) => {
      // fileProgress is 0-100 for this single file
      // We scale it down to its faction of the total upload
      const overall = baseProgress + (fileProgress / totalFiles);
      onProgress(Math.round(overall));
    });
    
    urls.push(url);
    filesCompleted++;
    onProgress(Math.round((filesCompleted / totalFiles) * 100));
  }
  
  return urls;
}
