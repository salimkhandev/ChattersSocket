// utils/getFileTypeEmoji.js
const getFileTypeEmoji = (frmt) => {
    if (!frmt) return false;

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'];
    const ext = frmt.split('.').pop().split('?')[0].toLowerCase();

    if (imageExtensions.includes(ext)) {
        return 'image'; // Image emoji
    }

    return 'file'; // File emoji
};

module.exports = getFileTypeEmoji;
