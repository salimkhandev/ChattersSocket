const isImageUrl = (frmt) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'];
    const ext = frmt.split('.').pop().split('?')[0].toLowerCase(); // handles query strings too

    return imageExtensions.includes(ext);
};
console.log(isImageUrl(null));


