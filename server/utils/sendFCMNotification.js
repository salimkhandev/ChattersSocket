// // use require instead of import
// const { sendNotification } = require("./sendNotification"); // replace with your actual FCM logic path

// /**
//  * Sends a push notification using FCM, handling both image and text logic.
//  *
//  * @param {{
//  *   receiver: string,
//  *   title: string,
//  *   body: string | null,
//  *   format?: string | null,
//  *   mediaUrl?: string | null
//  * }} options
//  */


// const sendFCMNotification = async ({ receiver,
//     title,
//     body,
//     format,
//     mediaUrl }) => {

// console.log('Salim sendFCMNotification');


//     const isImageUrl = (frmt) => {
//         const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'];
//         const ext = frmt.split('.').pop().split('?')[0].toLowerCase(); // handles query strings too

//         return imageExtensions.includes(ext);
//     };
//     let fileFormat = format && format !== null && format !== undefined && format !== ''
//     if (isImageUrl(fileFormat)) {
//         try {
//             await sendNotification({
//                 receiver,
//                 title,
//                 body,
//                 imageUrl: mediaUrl,
//                 badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"
//             });
//         } catch (err) {
//             console.error("❌ Error sending image notification:", err.message);
//         }
//     }
    

//     // if (isImageUrl(format)) {
//     //     await sendNotification({
//     //         receiver,
//     //         title: senderfullname,
//     //         body: msg.message,
//     //         imageUrl: media_url,
//     //         badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"

//     //     });
//     // }
// };

// // export default sendFCMNotification;
// module.exports = { sendFCMNotification };