// Dùng để cài đặt bộ nhớ đệm, giúp app nhận diện được PWA
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Đã cài đặt');
});

self.addEventListener('fetch', (e) => {
    // Để trống cơ bản để máy nhận diện đây là PWA
});