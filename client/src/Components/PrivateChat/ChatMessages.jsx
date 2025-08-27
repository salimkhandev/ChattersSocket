import { memo, useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2, Loader2, Mic, Edit3, X, Check } from 'lucide-react';
import VoiceMessagePlayer from './VoiceMessgae/VoiceMessagePlayer';
import SendingMediaPreview from './SendMedia/SendingMediaPreview'
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../context/VoiceContext';
import { useMedia } from '../../context/MediaContext';
import MediaModal from '../PrivateChat/SendMedia/MediaModal';

// Edit Modal Component
const EditMessageModal = ({ isOpen, onClose, currentMessage, onSave }) => {
    const [editedMessage, setEditedMessage] = useState(currentMessage);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setEditedMessage(currentMessage);
            setTimeout(() => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(currentMessage.length, currentMessage.length);
            }, 100);
        }
    }, [isOpen, currentMessage]);

    const handleSave = () => {
        const trimmedMessage = editedMessage.trim();
        if (!trimmedMessage || trimmedMessage === currentMessage) {
            onClose();
            return;
        }
        onSave(trimmedMessage);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Message</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <textarea
                        ref={textareaRef}
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Type your message..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!editedMessage.trim() || editedMessage.trim() === currentMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

function ChatMessages({ isChatLoading, chat, socket, setChat }) {
    const chatEndRef = useRef();
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [editModal, setEditModal] = useState({ isOpen: false, message: null });

    const { username } = useAuth();
    const { tempVoiceUrl, setTempVoiceUrl, tempUrlAudio } = useVoice();
    const { localUrl, localFormat, uploading, isModalOpen, setIsModalOpen } = useMedia();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [tempVoiceUrl, uploading]);

    const handleEditMessage = (msg) => {
        setEditModal({ isOpen: true, message: msg });
    };

    const handleSaveEdit = (newMessage, msg) => {
        // Optimistically update the message in UI
        setChat((prev) =>
            prev.map((m) =>
                m.id === msg.id
                    ? { ...m, message: newMessage, updated: true, showOptions: false }
                    : m
            )
        );

        // Emit socket event to update on backend & other users
        socket.emit("edit message", {
            messageId: msg.id,
            newMessage: newMessage,
            sender: username,
            receiver: msg.to === username ? msg.from : msg.to
        });
    };

    console.log('📱❌', { username, tempVoiceUrl, tempUrlAudio });

    return (
        <div>
            {isChatLoading ? (
                <p className="text-center text-gray-400 italic">Loading chat...</p>
            ) : (
                chat.map((msg, idx) => {
                    const prevMessage = idx > 0 ? chat[idx - 1] : null;
                    const showProfilePic = (
                        idx === 0 ||
                        !prevMessage ||
                        prevMessage.from !== msg.from
                    );

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${msg.from === username ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`px-4 py-2 mb-1 rounded-xl max-w-xs text-sm shadow-sm relative ${msg.from === username
                                        ? "bg-green-200 text-gray-900"
                                        : "bg-white text-gray-900 border"
                                    }`}
                            >
                                {/* Message Options - Positioned at top right */}
                                {((msg.from === username && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && !msg.is_deleted_for_everyone) ||
                                    (msg.from !== username && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && !msg.is_deleted_for_everyone)) && (
                                        <div className="absolute -top-2 right-2 z-10">
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
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border"
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

                                                    {/* Dropdown menu - positioned above and to the right */}
                                                    <div className="absolute bottom-full right-0 mb-2 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                                        {msg.from === username && (
                                                            <>
                                                                {!msg.is_voice && !msg.audio_url && !msg.media_url && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setChat(prev => prev.map(m => ({ ...m, showOptions: false })));
                                                                            handleEditMessage(msg);
                                                                        }}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
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
                                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
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
                                                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete for everyone
                                                                </button>
                                                            </>
                                                        )}

                                                        {msg.from !== username && (
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
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

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
                                                    <div className="rounded overflow-hidden border border-gray-200 shadow-sm w-full max-w-[200px] sm:max-w-[250px]">
                                                        {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(msg.format.toLowerCase()) ? (
                                                            <img
                                                                src={msg.media_url}
                                                                alt="sent image"
                                                                onClick={() => setSelectedMedia({ url: msg.media_url, format: msg.format })}
                                                                className="w-full h-auto max-h-[300px] object-cover cursor-pointer"
                                                            />
                                                        ) : ['mp4', 'webm'].includes(msg.format.toLowerCase()) ? (
                                                            <video
                                                                src={msg.media_url}
                                                                controls
                                                                onClick={() => setSelectedMedia({ url: msg.media_url, format: msg.format })}
                                                                className="w-full h-auto max-h-[300px] cursor-pointer"
                                                            />
                                                        ) : ['mp3', 'wav', 'ogg'].includes(msg.format.toLowerCase()) ? (
                                                            <audio
                                                                src={msg.media_url}
                                                                controls
                                                                className="bg-gray-100 rounded"
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

                                    {msg.updated && msg.from !== username && (
                                        <p className="italic text-gray-400 text-xs mt-1">
                                            edited at {new Date(msg.updated_at).toLocaleString("en-US", {
                                                timeZone: "Asia/Karachi",
                                                month: "short",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                        {msg.created_at && (
                                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {tempVoiceUrl && tempUrlAudio && (
                <div className="my-2 px-4 flex justify-end">
                    <div className="relative flex items-center gap-3 bg-muted/30 px-3 py-2 rounded-lg shadow-md">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <Mic className="text-primary w-5 h-5 animate-pulse" />
                                <Loader2 className="absolute top-0 left-0 w-5 h-5 text-primary animate-spin opacity-60" />
                            </div>
                        </div>
                        <div>
                            <VoiceMessagePlayer audioUrl={tempVoiceUrl} />
                        </div>
                        <div ref={chatEndRef}></div>
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
                onClose={() => setEditModal({ isOpen: false, message: null })}
                currentMessage={editModal.message?.message || ''}
                onSave={(newMessage) => handleSaveEdit(newMessage, editModal.message)}
            />

            <div ref={chatEndRef} className="h-1" />
        </div>
    );
}

export default memo(ChatMessages);