import { memo, useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2, Loader2, Mic, Edit3, X, ChevronDown } from 'lucide-react';
import VoiceMessagePlayer from './VoiceMessgae/VoiceMessagePlayer';
import SendingMediaPreview from './SendMedia/SendingMediaPreview'
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../context/VoiceContext';
import { useMedia } from '../../context/MediaContext';
import MediaModal from '../PrivateChat/SendMedia/MediaModal'; // adjust the path
import EditMessageModal from '../PrivateChat/EditMessageModal'; // adjust the path

function ChatMessages({ isChatLoading, chat, socket, setChat }) {
    const chatEndRef = useRef();
    const prevChatRef = useRef([]);
    const chatContainerRef = useRef();
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [editModal, setEditModal] = useState({ isOpen: false, messageId: null, currentText: '' });
    const [showScrollButton, setShowScrollButton] = useState(false);

    const { username } = useAuth();
    const { tempVoiceUrl, setTempVoiceUrl, tempUrlAudio } = useVoice();
    const { localUrl, localFormat, uploading, isModalOpen, setIsModalOpen } = useMedia();

    // Scroll position check function
    const checkScrollPosition = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Add scroll event listener
    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            return () => container.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    useEffect(() => {
        const prev = prevChatRef.current;

        // Check if it's just a message edit (same length, same IDs, same created_at)
        const isMessageEdit = prev.length === chat.length &&
            prev.length > 0 &&
            prev.every((msg, i) =>
                chat[i] &&
                msg.id === chat[i].id &&
                msg.created_at === chat[i].created_at
            );

        // Only scroll if it's not a message edit and chat is not loading
        if (!isMessageEdit && !isChatLoading && chatEndRef.current) {
            // Use setTimeout to ensure DOM is fully rendered before scrolling
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        }

        prevChatRef.current = chat;
    }, [chat, isChatLoading]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [tempVoiceUrl, uploading]); // scroll when new chat or temp voice arrives

    const handleEditMessage = (messageId, currentText) => {
        setEditModal({
            isOpen: true,
            messageId,
            currentText
        });
    };

    const handleSaveEdit = (newMessage) => {
        if (!newMessage || !editModal.messageId) return;

        // Optimistically update the message in UI
        setChat((prev) =>
            prev.map((m) =>
                m.id === editModal.messageId
                    ? { ...m, message: newMessage, updated: true, showOptions: false }
                    : m
            )
        );

        // Emit socket event to update on backend & other users
        const msg = chat.find(m => m.id === editModal.messageId);
        if (msg) {
            socket.emit("edit message", {
                messageId: editModal.messageId,
                newMessage: newMessage,
                sender: username,
                receiver: msg.to === username ? msg.from : msg.to
            });
        }
    };

    console.log('📱❌', { username, tempVoiceUrl, tempUrlAudio });

    return (
        <div className="relative h-full">
            <div
                ref={chatContainerRef}
                className="h-full overflow-y-auto"
            >
                {isChatLoading ? (
                    <p className="text-center text-gray-400 italic">Loading chat...</p>
                ) : (
                    chat.map((msg, idx) => {

                        const prevMessage = idx > 0 ? chat[idx - 1] : null;

                        const showProfilePic =
                            // !isCurrentUser &&
                            (
                                idx === 0 ||
                                !prevMessage ||
                                prevMessage.from !== msg.from
                            );
                        return <div
                            key={msg.id}
                            className={`flex ${msg.from === username ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`px-4 py-2 mb-1 rounded-xl max-w-xs text-sm shadow-sm ${msg.from === username
                                    ? "bg-green-200 text-gray-900"
                                    : "bg-white text-gray-900 border"
                                    }`}
                            >
                                {/* Message content */}
                                <div className="text-xs text-gray-500 mb-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        {showProfilePic && (
                                            <img
                                                src={msg.sender_profile_pic}
                                                alt="profile"
                                                className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow-sm"
                                            />
                                        )}

                                        <span className="font-semibold text-gray-700">
                                            {msg.from === username ? "You" : msg.senderfullname}
                                        </span>
                                    </div>

                                    {!msg.is_deleted_for_everyone &&
                                        !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && (
                                            <div className="flex flex-col items-start gap-1">

                                                {/* MEDIA PREVIEW OR DOWNLOAD */}
                                                {msg.media_url && msg.format && (
                                                    <div className="rounded overflow-hidden border border-gray-200 shadow-sm max-w-xs">
                                                        {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(msg.format.toLowerCase()) ? (
                                                            <img
                                                                src={msg.media_url}
                                                                alt="sent image"
                                                                onClick={() => setSelectedMedia({ url: msg.media_url, format: msg.format })}
                                                                className="w-full h-auto object-cover cursor-pointer"
                                                            />
                                                        ) : ['mp4', 'webm'].includes(msg.format.toLowerCase()) ? (
                                                            <video
                                                                src={msg.media_url}
                                                                controls
                                                                onClick={() => setSelectedMedia({ url: msg.media_url, format: msg.format })}
                                                                className="w-full h-auto cursor-pointer"
                                                            />

                                                        ) : ['mp3', 'wav', 'ogg'].includes(msg.format.toLowerCase()) ? (
                                                            <audio
                                                                src={msg.media_url}
                                                                controls
                                                                className=" bg-gray-100 rounded"

                                                            />
                                                        ) : (
                                                            <a
                                                                href={msg.media_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                                                                download
                                                            >
                                                                <span className="text-sm text-blue-600 underline break-all">
                                                                    {`Download ${msg.format.toUpperCase()}`}
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* SEEN / UNSEEN STATUS */}
                                                {msg.from === username && msg.type !== 'call' && (
                                                    msg.seen ? (
                                                        <div className="relative group inline-block">
                                                            <span className="text-[10px] text-blue-600 ml-2">Seen</span>
                                                            {msg.seen_at && (
                                                                <span className="absolute bottom-full mb-1 left-0 text-[10px] text-gray-500 bg-white px-1 w-max rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                    {new Date(msg.seen_at).toLocaleString("en-US", {
                                                                        timeZone: "Asia/Karachi",
                                                                        month: "short",
                                                                        day: "2-digit",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        hour12: true,
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 ml-2">Unseen</span>
                                                    )
                                                )}
                                            </div>
                                        )}

                                </div>

                                <div className="break-word items-start justify-between gap-2">
                                    <>
                                        <div className="break-words flex-1">
                                            {msg.deleted_for?.split(",").map(s => s.trim()).includes(username)
                                                ? (
                                                    <span className="italic text-gray-400">Deleted for you</span>
                                                ) : msg.is_deleted_for_everyone ? (
                                                    <span className="italic text-gray-400">This message was deleted for everyone</span>
                                                ) : msg.is_voice && msg.audio_url ? (
                                                    <VoiceMessagePlayer audioUrl={msg.audio_url} />

                                                ) : (
                                                    <p className="break-words">{msg.message}</p>
                                                )}
                                        </div>
                                        <p>
                                            {msg.updated && msg.from !== username && <span className="italic text-gray-400">edited at {new Date(msg.updated_at).toLocaleString("en-US", {
                                                timeZone: "Asia/Karachi",
                                                month: "short",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}</span>
                                            }
                                        </p>
                                    </>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {msg.created_at && (
                                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}

                                        {/* Message Options - For current user messages */}
                                        {msg.from === username && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && !msg.is_deleted_for_everyone ? (
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChat((prev) =>
                                                            prev.map((m) =>
                                                                m.id === msg.id
                                                                    ? { ...m, showOptions: !m.showOptions }
                                                                    : { ...m, showOptions: false }
                                                            )
                                                        );
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                    title="Message options"
                                                    aria-label="Message options"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>

                                                {msg.showOptions && (
                                                    <>
                                                        {/* Click outside overlay */}
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setChat(prev =>
                                                                prev.map(m => ({ ...m, showOptions: false }))
                                                            )}
                                                        />

                                                        {/* Dropdown menu - Mobile responsive positioning */}
                                                        <div className="absolute bottom-full mb-1 z-20 w-44 bg-white rounded-md shadow-lg py-1 border border-gray-200
                                                                       left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0">
                                                            {!msg.is_voice && !msg.audio_url && !msg.media_url && msg.type !== 'call' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setChat(prev =>
                                                                            prev.map(m => ({ ...m, showOptions: false }))
                                                                        );
                                                                        handleEditMessage(msg.id, msg.message);
                                                                    }}
                                                                    className="block w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                >
                                                                    <Edit3 className="w-3 h-5" />
                                                                    Edit
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChat((prev) =>
                                                                        prev.map((m) =>
                                                                            m.id === msg.id
                                                                                ? { ...m, deleted_for: username, showOptions: false }
                                                                                : m
                                                                        )
                                                                    );
                                                                    socket.emit("delete for me", {
                                                                        username,
                                                                        messageId: msg.id,
                                                                    });
                                                                }}
                                                                className="block w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                Delete for me
                                                            </button>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChat((prev) =>
                                                                        prev.map((m) =>
                                                                            m.id === msg.id
                                                                                ? { ...m, is_deleted_for_everyone: true, showOptions: false }
                                                                                : m
                                                                        )
                                                                    );
                                                                    socket.emit("delete for everyone", {
                                                                        messageId: msg.id,
                                                                        audio_url: msg.audio_url || null,
                                                                        media_url: msg.media_url || null,
                                                                        sender: username,
                                                                        receiver: msg.to === username ? msg.from : msg.to
                                                                    });
                                                                }}
                                                                className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                            >
                                                                <Trash2 className="w-3 h-5" />
                                                                <span>Delete for everyone</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : msg.from !== username && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && !msg.is_deleted_for_everyone && (
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChat((prev) =>
                                                            prev.map((m) =>
                                                                m.id === msg.id
                                                                    ? { ...m, showOptions: !m.showOptions }
                                                                    : { ...m, showOptions: false }
                                                            )
                                                        );
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                    title="Message options"
                                                    aria-label="Message options"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>

                                                {msg.showOptions && (
                                                    <>
                                                        {/* Click outside overlay */}
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setChat(prev =>
                                                                prev.map(m => ({ ...m, showOptions: false }))
                                                            )}
                                                        />

                                                        {/* Dropdown menu - Mobile responsive positioning */}
                                                        <div className="absolute bottom-full mb-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200
                                                                       left-1/2 -translate-x-1/2 sm:left-0 sm:right-auto sm:translate-x-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChat((prev) =>
                                                                        prev.map((m) =>
                                                                            m.id === msg.id
                                                                                ? { ...m, deleted_for: username, showOptions: false }
                                                                                : m
                                                                        )
                                                                    );
                                                                    socket.emit("delete for me", {
                                                                        username,
                                                                        messageId: msg.id,
                                                                    });
                                                                }}
                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete for me
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                    })

                )}

                {tempVoiceUrl && tempUrlAudio && (
                    <div className="my-2 px-4 flex justify-end">
                        <div className="relative flex items-center gap-3 bg-muted/30 px-3 py-2 rounded-lg shadow-md">
                            {/* Spinner & Mic */}
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    <Mic className="text-primary w-5 h-5 animate-pulse" />
                                    <Loader2 className="absolute top-0 left-0 w-5 h-5 text-primary animate-spin opacity-60" />
                                </div>
                            </div>

                            {/* Blurred voice preview */}
                            <div>
                                <VoiceMessagePlayer audioUrl={tempVoiceUrl} />
                            </div>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="my-2 px-4 flex justify-end">
                        <div>
                            <SendingMediaPreview />
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} className="h-1" />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-20 right-4 z-30 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                    title="Scroll to bottom"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            )}

            {selectedMedia && (
                <MediaModal
                    url={selectedMedia.url}
                    format={selectedMedia.format}
                    onClose={() => setSelectedMedia(null)}
                />
            )}

            {/* Edit Message Modal */}
            <EditMessageModal
                isOpen={editModal.isOpen}
                message={editModal.currentText}
                onClose={() => setEditModal({ isOpen: false, messageId: null, currentText: '' })}
                onSave={handleSaveEdit}
            />
        </div>
    )
}

export default memo(ChatMessages)   