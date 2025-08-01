const url = "https://res.cloudinary.com/chattersocket/raw/upload/v1753706024/ngcrng0al3kr5uvmhaof.doc";

// Step 1: Remove everything before the filename
const parts = url.split('/');

const filenameWithExt = parts[parts.length - 1]; // "mddk9wexdaw1kiozrlin.png"

// Step 2: Remove the extension
const publicId = filenameWithExt.split('.')[0];

console.log(publicId); // 👉 "mddk9wexdaw1kiozrlin"