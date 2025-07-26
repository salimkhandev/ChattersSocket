// cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'chattersocket',
    api_key: '736435586678971',
    api_secret: 'ZbDQnEbu50RLf_31IIMJIcUiWjk'
});

// Test connection
cloudinary.api
    .ping()
    .then(result => console.log('✅ Cloudinary Connected:'))
    .catch(error => console.error('❌ Cloudinary Connection Failed:', error));
// cloudinary.search
//     .expression('folder:audios') // Replace `my_folder` with your actual folder name
//     .execute()
//     .then(result => {
//         result.resources.forEach(file => {
//             console.log('📄 Public ID:', file.public_id);
//             console.log('🔗 Secure URL:', file.secure_url);
//             console.log('🎧 Format:', file.format);
//         });
//     })
//     .catch(error => {
//         console.error('❌ Error fetching from folder:', error);
//     });

// cloudinary.uploader.destroy('voiceMessages/kcdaqvnxdv6p0spdb74d', {
    
//     resource_type: 'video',
//     invalidate: true, // 🔥 invalidate from CDN
// }, function (error, result) {
//     console.log(result, error);
// });

module.exports = cloudinary;






