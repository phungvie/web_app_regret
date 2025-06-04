// Chat.jsx - Giao diện chat với chú thích từng dòng
import React, {useCallback, useEffect, useRef, useState} from "react";
import {connectUser, disconnectUser, getMyProfile, getOnlineUsers} from "../services/userService";
import {getMessages, getMyChatRooms, sendMessage} from "../services/chatService";
import keycloak from "../keycloak";
import { CONFIG} from "../configurations/configuration";
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

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

    const stompClient = useRef(null);

    // Lấy thông tin profile của user hiện tại khi component mount
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
        console.log("getProfile", data.result)
    };


    // Lấy danh sách phòng chat từ API khi component mount
    useEffect(() => {
        async function fetchChatRooms() {
            const response = await getMyChatRooms();
            setChatRooms(response.data.result);
            console.log("getMyChatRooms", response.data.result)
            // Nếu có phòng chat, chọn phòng đầu tiên
            if (response.data.result && response.data.result.length > 0) {
                setSelectedRoom(response.data.result[0]);
            }
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

    // Kết nối WebSocket khi component mount
    useEffect(() => {
        // Chỉ kết nối khi đã có thông tin user
        if (!currentUser.profileId) return;
        const socket = new SockJS(CONFIG.API_GATEWAY + '/ws');
        stompClient.current = Stomp.over(socket);
        stompClient.current.connect(
            { Authorization: 'Bearer ' + keycloak.token },
            onConnected,
            onError
        );
        // Cleanup khi unmount
        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect();
                disconnectUser().catch(() => console.error("lỗi api disconnectUser"));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.profileId]);

    function onConnected() {
        // Đăng ký nhận tin nhắn cá nhân
        if (!currentUser.profileId) return;
        stompClient.current.subscribe(
            `/user/${currentUser.profileId}/queue/messages`,
            onMessageReceived
        );
        // stompClient.current.subscribe(`/user/public`, onMessageReceived);

        // stompClient.current.send("/app/user.connectUser", {});
        connectUser().catch(reason => console.error("lỗi api connectUser",reason));

        // Đăng ký nhận tin nhắn public nếu cần
        // stompClient.current.subscribe('/topic/public', onMessageReceived);
    }

    function onError(error) {
        console.error('WebSocket error:', error);
    }

    function onMessageReceived(message) {
        // Xử lý khi nhận được tin nhắn mới
        try {
            const msg = JSON.parse(message.body);
            setMessages(prev => [...prev, msg])
            console.log("onMessageReceived", msg);
        } catch (e) {
            console.error('Lỗi parse message:', e);
        }
    }

    // Xử lý gửi tin nhắn http
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim()) return;
        try {
            const res = await sendMessage({
                recipientId: selectedRoom.recipientId,
                content: messageInput,
            });
            // Thêm tin nhắn vừa gửi vào danh sách tin nhắn nếu gửi thành công
            setMessages(prev => [
                ...prev,
                {
                    senderId: currentUser.profileId,
                    recipientId: selectedRoom.recipientId,
                    content: messageInput,
                    // Có thể bổ sung thêm các trường khác nếu API trả về
                }
            ]);
            setMessageInput("");
        } catch (err) {
            console.error("Lỗi sendMessage", err);
        }
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
        <div style={{display: "flex", height: "100vh", width: "100vw", border: "1px solid #ccc", position: "fixed", top: 0, left: 0, background: "#fff", zIndex: 1000}}>
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
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: 8,
                                        display: "flex",
                                        justifyContent: msg.senderId === currentUser.profileId ? "flex-end" : "flex-start"
                                    }}
                                >
                                    <div
                                        style={{
                                            background: msg.senderId === currentUser.profileId ? "#DCF8C6" : "#f1f0f0",
                                            padding: "8px 12px",
                                            borderRadius: 12,
                                            maxWidth: "60%",
                                            textAlign: msg.senderId === currentUser.profileId ? "right" : "left"
                                        }}
                                    >
                                        <b>{msg.senderId === currentUser.profileId ? "Me" : selectedRoom.recipientName}:</b> {msg.content}
                                    </div>
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
                          style={{
                              display: "flex",
                              padding: 8,
                              borderTop: "1px solid #eee",
                              background: "transparent" // nền trong suốt
                          }}>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            style={{
                                flex: 1,
                                marginRight: 8,
                                padding: "10px 14px",
                                border: "1px solid #b2dfdb",
                                borderRadius: 20,
                                outline: "none",
                                fontSize: 16,
                                background: "#f1f8e9"
                            }}
                        />
                        <button type="submit"
                                style={{
                                    background: "#66bb6a",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8, // vuông hơn
                                    padding: "10px 24px",
                                    fontWeight: 600,
                                    fontSize: 16,
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                    boxShadow: "0 2px 6px rgba(102,187,106,0.08)"
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#43a047'}
                                onMouseOut={e => e.currentTarget.style.background = '#66bb6a'}
                        >
                            Gửi
                        </button>
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
