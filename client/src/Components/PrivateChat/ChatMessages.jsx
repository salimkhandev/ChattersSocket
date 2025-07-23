import {memo} from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'; // If you're using Lucide icons
import { useUser } from '../../context/UserContext';

function ChatMessages({ isChatLoading, chat, socket, setChat }) {
    const { username} = useUser();

  return (
    <div>
          {isChatLoading ? (
              <p className="text-center text-gray-400 italic">Loading chat...</p>
          ) : (
              chat.map((msg,idx) => {

             

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
  { showProfilePic && (
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


                              {msg.from 
                              === username ? (
                                  msg.seen ? (
                                      <div className="relative group inline-block">
                                          {!msg.is_deleted_for_everyone && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && (
                                              <span className="text-[10px] text-blue-600 ml-2">Seen</span>
                                          )}
                                          {msg.seen_at && !msg.deleted_for?.split(",").map(s => s.trim()).includes(username) && !msg.is_deleted_for_everyone && (
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
                              ) : null}
                          </div>
                    

                          <div className="break-word items-start justify-between gap-2">
                                          <>
                              <p className="break-words flex-1">
                                  {msg.deleted_for?.split(",").map(s => s.trim()).includes(username)
                                      ? (
                                          <span className="italic text-gray-400">Deleted for you</span>
                                      ) : msg.is_deleted_for_everyone ? (
                                          <span className="italic text-gray-400">This message was deleted for everyone</span>
                                      ) : (
                                          msg.message
                                      )}
                              </p>
                              <p>
                                     {msg.updated && msg.from!==username &&<span className="italic text-gray-400">edited at {new Date(msg.updated_at).toLocaleString("en-US", {
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

                                  {/* Message Options */}
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

                                                  {/* Dropdown menu */}
                                                  <div className="absolute right-0 mt-1 z-20 w-44  bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                                     <button
                                                         onClick={(e) => {
                                                             e.stopPropagation();

                                                             const newMessage = prompt("Edit your message:", msg.message);
                                                             if (!newMessage || newMessage.trim() === msg.message) return;

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
                                                                 newMessage: newMessage.trim(),
                                                             });
                                                         }}
                                                         className="block w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                     >
                                                         ✏️ Edit
                                                     </button>

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
                                                                  username,
                                                                  messageId: msg.id,
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

                                                  {/* Dropdown menu */}
                                                  <div className="absolute left-0 mt-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
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

}))

          }
    </div>
  )
}

// export default React.memo(ChatMessages) // This is to prevent unnecessary re-renders of the component
export default memo(ChatMessages) // This is to prevent unnecessary re-renders of the component
