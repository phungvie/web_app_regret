// Chat.jsx - Giao diện chat với chú thích từng dòng
import React, {useEffect, useState} from "react";
import {getMyProfile, getOnlineUsers} from "../services/userService";
import {getMessages, getMyChatRooms} from "../services/chatService";
import keycloak from "../keycloak";

const Chat = () => {
    // State lưu danh sách các phòng chat
    const [chatRooms, setChatRooms] = useState([]);
    // State lưu phòng chat đang được chọn
    const [selectedRoom, setSelectedRoom] = useState(null);
    // State lưu tin nhắn của phòng chat đang chọn
    const [messages, setMessages] = useState([]);
    // State lưu nội dung tin nhắn đang nhập
    const [messageInput, setMessageInput] = useState("");
    // State lưu danh sách người dùng online
    const [onlineUsers, setOnlineUsers] = useState([]);
    // State lưu thông tin user hiện tại (cần thay bằng auth thực tế)
    const [currentUser, setCurrentUser] = useState(
        {
            profileId: null,
            userId: null,
            email: null,
            username: null,
            firstName: null,
            lastName: null,
            dob: null,
            status: null
        }
    );
    useEffect(() => {
        getProfile()
            .catch(reason => {
                console.error("Lỗi khi lấy profile phòng chat:", reason);
                setCurrentUser(null);
            });
    }, []);

    const getProfile = async () => {
        const response = await getMyProfile();
        const data = response.data;
        setCurrentUser(data.result);
        console.log("getProfile",data.result)
    };

    // Lấy danh sách phòng chat từ API khi component mount
    useEffect(() => {
        async function fetchChatRooms() {
            const response = await getMyChatRooms();
            setChatRooms(response.data.result);
            console.log("getMyChatRooms", response.data.result)
        }

        fetchChatRooms()
            .catch(reason => {
                console.error("Lỗi khi lấy danh sách phòng chat:", reason);
                setChatRooms([]);
            });
    }, []);

    // Lấy danh sách user online từ API khi component mount
    useEffect(() => {
        async function fetchOnlineUsers() {
            const response = await getOnlineUsers();
            setOnlineUsers(response.data.result);
            console.log("getOnlineUsers", response.data.result)
        }

        fetchOnlineUsers()
            .catch(reason => {
                console.error("Lỗi khi lấy danh sách người dùng online:", reason);
                setOnlineUsers([]);
            });
    }, []);

    // Khi chọn phòng chat, lấy tin nhắn của phòng đó
    useEffect(() => {
        async function fetchMessages() {
            if (selectedRoom) {
                const response = await getMessages(selectedRoom.senderId, selectedRoom.recipientId);
                setMessages(response.data.result);
                console.log("getMessages", response.data.result)
            }
        }
        fetchMessages()
            .catch(reason => {
                console.error("Lỗi khi lấy tin nhắn:", reason);
                setMessages([]);
            });
    }, [selectedRoom]);

    // Xử lý gửi tin nhắn
    const handleSendMessage = async (e) => {
    };

    // Khi click vào user online, tìm hoặc tạo phòng chat với user đó
    const handleUserClick = async (user) => {
        // Tìm phòng chat đã có giữa 2 user
        let room = chatRooms.find(
            r => (r.senderId === currentUser.profileId && r.recipientId === user.profileId) ||
                (r.senderId === user.profileId && r.recipientId === currentUser.profileId)
        );
        console.log("handleUserClick", room);
        if (!room) {
            // Nếu chưa có thì tạo mới (chỉ tạo UI, thực tế tạo khi gửi tin nhắn đầu tiên)
            room = {
                senderId: currentUser.profileId,
                recipientId: user.profileId,
                recipientName: user.firstName + " " + user.lastName
            };
            setChatRooms(prev => [...prev, room]);
        }
        setSelectedRoom(room); // Chọn phòng chat
    };

    return (
        <div style={{display: "flex", height: "80vh", border: "1px solid #ccc"}}>
            {/* Bên trái: Danh sách phòng chat */}
            <div style={{flex: 1, borderRight: "1px solid #eee", overflowY: "auto"}}>
                <h3 style={{textAlign: "center"}}>Chat Rooms</h3>
                <ul style={{listStyle: "none", padding: 0}}>
                    {chatRooms.map((room, idx) => (
                        <li
                            key={idx}
                            style={{
                                padding: "10px",
                                background: selectedRoom === room ? "#f0f0f0" : "#fff",
                                cursor: "pointer"
                            }}
                            onClick={() => setSelectedRoom(room)}
                        >
                            {room.recipientName || room.recipientId}
                        </li>
                    ))}
                </ul>
            </div>
            {/* Ở giữa: Hiển thị tin nhắn và gửi tin nhắn */}
            <div style={{flex: 2, display: "flex", flexDirection: "column"}}>
                <div style={{flex: 1, overflowY: "auto", padding: 16}}>
                    {selectedRoom ? (
                        messages.length ? (
                            messages.map((msg, idx) => (
                                <div key={idx} style={{marginBottom: 8}}>
                                    <b>{msg.senderId === currentUser.profileId ? "Me" : msg.senderId}:</b> {msg.content}
                                </div>
                            ))
                        ) : (
                            <div>Chưa có tin nhắn nào.</div>
                        )
                    ) : (
                        <div>Chọn phòng chat hoặc người dùng để bắt đầu.</div>
                    )}
                </div>
                {/* Form gửi tin nhắn */}
                {selectedRoom && (
                    <form onSubmit={handleSendMessage}
                          style={{display: "flex", padding: 8, borderTop: "1px solid #eee"}}>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            style={{flex: 1, marginRight: 8}}
                        />
                        <button type="submit">Gửi</button>
                    </form>
                )}
            </div>
            {/* Bên phải: Danh sách user online */}
            <div style={{flex: 1, borderLeft: "1px solid #eee", overflowY: "auto"}}>
                <h3 style={{textAlign: "center"}}>Online Users</h3>
                <ul style={{listStyle: "none", padding: 0}}>
                    {onlineUsers.map((user, idx) => (
                        <li
                            key={user.profileId || idx}
                            style={{padding: "10px", cursor: "pointer"}}
                            onClick={() => handleUserClick(user)}
                        >
                            {user.firstName + " " + user.lastName || user.profileId}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


export default Chat;

