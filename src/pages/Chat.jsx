// Chat.jsx - Giao diện chat với chú thích từng dòng
import React, { useEffect, useRef, useState} from "react";
import {connectUser, disconnectUser, getMyProfile, getOnlineUsers} from "../services/userService";
import {getMessages, getMyChatRooms, sendMessage} from "../services/chatService";
import keycloak from "../keycloak";
import {CONFIG} from "../configurations/configuration";
import SockJS from 'sockjs-client';
import {Stomp} from '@stomp/stompjs';
import {FaMoon, FaSun, FaUsers, FaUser} from "react-icons/fa";
import EmojiConvertor from 'emoji-js';
import ChatRoomList from '../components/ChatRoomList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import OnlineUserList from '../components/OnlineUserList';

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

    // State cho ẩn/hiện panel Online Users
    const [showOnlineUsers, setShowOnlineUsers] = useState(true);
    // State cho dark mode, lấy giá trị từ localStorage nếu có
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === null ? false : saved === 'true';
    });

    // Lưu darkMode vào localStorage mỗi khi thay đổi
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);

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
                const response = await getMessages(selectedRoom.senderId, selectedRoom.recipientId, 20, 0);
                // Sắp xếp tin nhắn theo thời gian tăng dần (cũ -> mới)
                const sortedMessages = response.data.result.content
                    // .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                ;
                setMessages(sortedMessages);
                console.log("getMessages", sortedMessages)
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
            {Authorization: 'Bearer ' + keycloak.token},
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
        connectUser().catch(reason => console.error("lỗi api connectUser", reason));

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
            await sendMessage({
                recipientId: selectedRoom.recipientId,
                content: messageInput,
            });
// Thêm tin nhắn vừa gửi vào danh sách tin nhắn nếu gửi thành công
            if (currentUser.profileId !== selectedRoom.recipientId) {
                const newMessage = {
                    senderId: currentUser.profileId,
                    recipientId: selectedRoom.recipientId,
                    content: messageInput,
                    timestamp: new Date().toISOString(),
                    // Có thể bổ sung thêm các trường khác nếu API trả về
                }
                setMessages(prev => [
                    ...prev,
                    newMessage
                ]);
                console.log("newMessage", newMessage)
            }
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

    // State lưu index các tin nhắn đang hiển thị chi tiết
    const [detailedMsgIdx, setDetailedMsgIdx] = useState([]);

    // Hàm toggle chi tiết tin nhắn
    const toggleDetail = idx => {
        setDetailedMsgIdx(prev =>
            prev.includes(idx)
                ? prev.filter(i => i !== idx)
                : [...prev, idx]
        );
    };

    function formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = Math.floor((now - date) / 1000); // giây
        if (diff < 60) return `Vài giây trước`;
        if (diff < 3600) {
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            return `${m} phút${s > 0 ? ` ${s} giây` : ''} trước`;
        }
        if (diff < 86400) {
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            return `${h} giờ${m > 0 ? ` ${m} phút` : ''} trước`;
        }
        if (diff < 2592000) {
            const d = Math.floor(diff / 86400);
            const h = Math.floor((diff % 86400) / 3600);
            return `${d} ngày${h > 0 ? ` ${h} giờ` : ''} trước`;
        }
        return date.toLocaleDateString();
    }

    // Thêm state cho emoji picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Hàm thêm emoji vào input (dùng emoji-picker-react)
    const onEmojiClick = (emojiData) => {
        setMessageInput(msg => msg + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Thêm ref cho emoji picker
    const emojiBtnRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Đóng emoji picker khi click ra ngoài
    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target) &&
                emojiBtnRef.current &&
                !emojiBtnRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    // Ref cho container tin nhắn để cuộn xuống cuối
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống cuối khi đổi phòng chat hoặc có tin nhắn mới
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [selectedRoom, messages]);


    // Khởi tạo emoji-js convertor
    const emoji = new EmojiConvertor();
    emoji.replace_mode = 'unified';
    emoji.allow_native = true;

    // Hàm chuyển đổi ký tự mặt cười thành emoji dùng emoji-js
    function replaceEmoticonsWithEmoji(text) {
        return emoji.replace_emoticons(text);
    }

    return (
        <div style={{
            display: "flex",
            height: "100vh",
            width: "100vw",
            border: "none",
            position: "fixed",
            top: 0,
            left: 0,
            background: darkMode ? "#18191A" : "#fff",
            color: darkMode ? "#f0f6ff" : "#18191A",
            zIndex: 1000,
            gap: "8px",
            padding: "8px",
            boxShadow: darkMode ? "0 12px 48px 0 rgba(25, 118, 210, 0.10)" : "0 12px 48px 0 rgba(25, 118, 210, 0.25)"
        }}>
            {/* Nút chuyển dark/light mode */}
            <button
                onClick={() => setDarkMode(dm => !dm)}
                style={{
                    position: "absolute",
                    top: 16,
                    left: 32,
                    zIndex: 1100,
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: darkMode ? "#333" : "#e3f2fd",
                    color: darkMode ? "#f0f6ff" : "#18191A",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.10)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}
            >
                {darkMode ? (<FaSun/>) : (<FaMoon/>) }
            </button>
            {/* Bên trái: Danh sách phòng chat */}
            <ChatRoomList
                chatRooms={chatRooms}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                darkMode={darkMode}
            />
            {/* Ở giữa: Hiển thị tin nhắn và gửi tin nhắn */}
            <div style={{
                flex: 2,
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                border: "none",
                boxShadow: darkMode ? "0 8px 32px 0 rgba(25, 118, 210, 0.10)" : "0 8px 32px 0 rgba(25, 118, 210, 0.28)",
                background: darkMode ? "#242526" : "#f0f6ff",
                transition: "box-shadow 0.3s"
            }}>
                {/* Nút ẩn/hiện Online Users */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: darkMode ? "rgba(255,255,255,0.1)" : 'rgba(255,255,255,0.7)',
                    borderBottom: '1px solid #e0e0e0',
                    minHeight: 48,
                    padding: '0 8px'
                }}>
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: 18,
                        color: darkMode ? "#f0f6ff" : '#222',
                        letterSpacing: 0.5
                    }}>
                        {selectedRoom ? (selectedRoom.recipientName || selectedRoom.recipientId) : 'Chọn phòng chat'}
                    </div>
                    <button onClick={() => setShowOnlineUsers(v => !v)} style={{
                        marginLeft: 8,
                        border: 'none',
                        background: darkMode ? "#333" : "#e3f2fd",
                        color: darkMode ? "#f0f6ff" : "#1976d2",
                        borderRadius: 6,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        {showOnlineUsers ? (<FaUsers/>) : (<FaUser/>) }
                    </button>
                </div>
                <MessageList
                    messages={messages}
                    currentUser={currentUser}
                    selectedRoom={selectedRoom}
                    darkMode={darkMode}
                    detailedMsgIdx={detailedMsgIdx}
                    toggleDetail={toggleDetail}
                    formatTimeAgo={formatTimeAgo}
                    messagesEndRef={messagesEndRef}
                    replaceEmoticonsWithEmoji={replaceEmoticonsWithEmoji}
                    setDetailedMsgIdx={setDetailedMsgIdx}
                />
                {selectedRoom && (
                    <MessageInput
                        messageInput={messageInput}
                        setMessageInput={setMessageInput}
                        handleSendMessage={handleSendMessage}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        emojiBtnRef={emojiBtnRef}
                        emojiPickerRef={emojiPickerRef}
                        onEmojiClick={onEmojiClick}
                        darkMode={darkMode}
                    />
                )}
            </div>
            {/* Bên phải: Danh sách user online */}
            {showOnlineUsers && (
                <OnlineUserList
                    onlineUsers={onlineUsers}
                    handleUserClick={handleUserClick}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
};

// Custom scrollbar CSS cho dark/light mode và emoji picker
const style = document.createElement('style');
style.innerHTML = `
.scrollbar-dark::-webkit-scrollbar {
  width: 12px;
  background: #23272f;
  border-radius: 10px;
}
.scrollbar-dark::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #43a047 0%, #388e3c 100%);
  border-radius: 10px;
  border: 3px solid #23272f;
}
.scrollbar-dark::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}
.scrollbar-light::-webkit-scrollbar {
  width: 12px;
  background: #e3f2fd;
  border-radius: 10px;
}
.scrollbar-light::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #b2dfdb 0%, #43a047 100%);
  border-radius: 10px;
  border: 3px solid #e3f2fd;
}
.scrollbar-light::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #66bb6a 0%, #388e3c 100%);
}
.emoji-scrollbar::-webkit-scrollbar {
  width: 10px;
  background: #e0f2f1;
  border-radius: 8px;
}
.emoji-scrollbar::-webkit-scrollbar-thumb {
  background: #b2dfdb;
  border-radius: 8px;
  border: 2px solid #e0f2f1;
}
.emoji-scrollbar-dark::-webkit-scrollbar {
  width: 10px;
  background: #222;
  border-radius: 8px;
}
.emoji-scrollbar-dark::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 8px;
  border: 2px solid #222;
}
.EmojiPickerReact .epr-body::-webkit-scrollbar {
  width: 10px;
  background: #e0f2f1;
  border-radius: 8px;
}
.EmojiPickerReact .epr-body::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #b2dfdb 0%, #43a047 100%);
  border-radius: 8px;
  border: 2px solid #e0f2f1;
}
.EmojiPickerReact .epr-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #66bb6a 0%, #388e3c 100%);
}
.EmojiPickerReact .epr-body {
  scrollbar-width: thin;
  scrollbar-color: #43a047 #e0f2f1;
}
/* Firefox */
.scrollbar-dark {
  scrollbar-width: thin;
  scrollbar-color: #43a047 #23272f;
}
.scrollbar-light {
  scrollbar-width: thin;
  scrollbar-color: #43a047 #e3f2fd;
}
`;
document.head.appendChild(style);

export default Chat;
