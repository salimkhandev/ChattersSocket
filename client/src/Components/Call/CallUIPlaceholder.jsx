import React from "react";
import { useCall } from "../../context/CallContext";

export default function CallUIPlaceholder({socket,username}) {
    const { incomingCall, acceptCall, rejectCall, setCallAccepted, callerFullname, setOutGoingCall } = useCall();

    if (!incomingCall) return null;
    const handleRejectCall=()=>{
        socket.emit("rejectCall", {
            username,
        });
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl">
                <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
                <p className="text-gray-500 mb-4">{callerFullname} is calling you...</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setCallAccepted (true); 
                            acceptCall();
                            socket.emit("acceptCall", { username }); 
                                }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => {
                            rejectCall();
                            handleRejectCall();
                    
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
