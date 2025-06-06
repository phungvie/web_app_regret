// Chat.jsx - Giao diện chat với chú thích từng dòng
import React, {useCallback, useEffect, useRef, useState} from "react";
import {connectUser, disconnectUser, getMyProfile, getOnlineUsers} from "../services/userService";
import {getMessages, getMyChatRooms, sendMessage} from "../services/chatService";
import keycloak from "../keycloak";
import { CONFIG} from "../configurations/configuration";
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { FaMoon, FaSun, FaUsers, FaUser, FaSmile } from "react-icons/fa";

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
        localStorage.setItem('darkMode', darkMode);
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
            if(currentUser.profileId!==selectedRoom.recipientId){
                setMessages(prev => [
                    ...prev,
                    {
                        senderId: currentUser.profileId,
                        recipientId: selectedRoom.recipientId,
                        content: messageInput,
                        timestamp: new Date().toISOString(),
                        // Có thể bổ sung thêm các trường khác nếu API trả về
                    }
                ]);
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

    // Danh sách emoji phân loại
    const emojiCategories = {
        "Smileys": ["😀", "😂", "😍", "😎", "😭", "😡", "😅", "😆", "😉", "😘", "😇", "😜", "🤔", "😏", "😬", "😱", "🥰", "🤩", "😋", "😚", "😙", "😗", "😐", "😑", "😶", "🙄", "😯", "😲", "🥲", "🥹", "😮", "😴", "🤤", "😪", "😵", "🤯", "😤", "😠", "😔", "😞", "😟", "😢", "😥", "😰", "😓"],
        "Gestures": ["👍", "🙏", "👏", "🙌", "👐", "🤲", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👎", "✊", "👊", "🤛", "🤜"],
        "Hearts": ["❤️", "🩷", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "❤", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍"],
        "Animals": ["😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊"],
        "Other": ["💩", "🔥", "✨", "🌟", "💫", "💥", "💦", "💨", "🕳️", "💣", "💬", "🎉", "😈", "👿", "👻", "💀", "☠️", "👽", "🤖", "🎃", "🤑", "🤠", "💯", "💢"]
    };
    const emojiCategoryNames = Object.keys(emojiCategories);
    const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(emojiCategoryNames[0]);

    // Hàm thêm emoji vào input
    const addEmoji = (emoji) => {
        setMessageInput(msg => msg + emoji);
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
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedRoom, messages]);


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
                {darkMode ? (<FaSun />) : (<FaMoon />)}
            </button>
            {/* Bên trái: Danh sách phòng chat */}
            <div style={{
                flex: 1,
                borderRight: "none",
                overflowY: "auto",
                marginRight: "6px",
                borderRadius: "18px",
                border: "none",
                boxShadow: darkMode ? "0 8px 32px 0 rgba(25, 118, 210, 0.10)" : "0 8px 32px 0 rgba(25, 118, 210, 0.28)",
                background: darkMode ? "#242526" : "#f0f6ff",
                transition: "box-shadow 0.3s, background 0.3s"
            }}>
                <h3 style={{textAlign: "center", color: darkMode ? "#f0f6ff" : "#18191A"}}>Chat Rooms</h3>
                <ul style={{listStyle: "none", padding: 0, margin: 0}}>
                    {chatRooms.map((room, idx) => {
                        const isSelected = selectedRoom === room;
                        const name = room.recipientName || room.recipientId;
                        const avatarText = name ? name.trim().charAt(0).toUpperCase() : '?';
                        return (
                            <li
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: "12px 14px",
                                    margin: "8px 10px",
                                    background: isSelected ? (darkMode ? "#2e7d32" : "#b9f6ca") : (darkMode ? "#242526" : "#f0f6ff"),
                                    cursor: "pointer",
                                    borderRadius: "14px",
                                    border: isSelected ? `2px solid ${darkMode ? '#b9f6ca' : '#43a047'}` : "1.5px solid transparent",
                                    boxShadow: isSelected ? "0 4px 16px 0 rgba(76, 175, 80, 0.18)" : "0 1px 4px 0 rgba(76, 175, 80, 0.08)",
                                    color: darkMode ? "#f0f6ff" : "#18191A",
                                    fontWeight: isSelected ? 700 : 500,
                                    transition: "all 0.2s",
                                    position: 'relative',
                                }}
                                onClick={() => setSelectedRoom(room)}
                                onMouseOver={e => e.currentTarget.style.background = isSelected ? (darkMode ? '#388e3c' : '#69f0ae') : (darkMode ? '#30313a' : '#e0f2f1')}
                                onMouseOut={e => e.currentTarget.style.background = isSelected ? (darkMode ? '#2e7d32' : '#b9f6ca') : (darkMode ? '#242526' : '#f0f6ff')}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 38, height: 38,
                                    borderRadius: '50%',
                                    background: isSelected ? (darkMode ? '#66bb6a' : '#43a047') : (darkMode ? '#333' : '#b2dfdb'),
                                    color: isSelected ? '#fff' : (darkMode ? '#fff' : '#388e3c'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                }}>{avatarText}</div>
                                {/* Info */}
                                <div style={{flex: 1, minWidth: 0}}>
                                    <div style={{fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</div>
                                    <div style={{fontSize: 12, color: darkMode ? '#b0bec5' : '#607d8b', marginTop: 2}}>
                                        ID: {room.recipientId}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* Ở giữa: Hiển thị tin nhắn và gửi tin nhắn */}
            <div style={{flex: 2, display: "flex", flexDirection: "column", borderRadius: "12px", border: "none", boxShadow: darkMode ? "0 8px 32px 0 rgba(25, 118, 210, 0.10)" : "0 8px 32px 0 rgba(25, 118, 210, 0.28)", background: darkMode ? "#242526" : "#f0f6ff", transition: "box-shadow 0.3s"}}>
                {/* Nút ẩn/hiện Online Users */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? "rgba(255,255,255,0.1)" : 'rgba(255,255,255,0.7)', borderBottom: '1px solid #e0e0e0', minHeight: 48, padding: '0 8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: 18, color: darkMode ? "#f0f6ff" : '#222', letterSpacing: 0.5}}>
                        {selectedRoom ? (selectedRoom.recipientName || selectedRoom.recipientId) : 'Chọn phòng chat'}
                    </div>
                    <button onClick={() => setShowOnlineUsers(v => !v)} style={{marginLeft: 8, border: 'none', background: darkMode ? "#333" : "#e3f2fd", color: darkMode ? "#f0f6ff" : "#1976d2", borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                        {showOnlineUsers ? (<FaUsers />) : (<FaUser />)}
                    </button>
                </div>
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 16,
                    // Custom scrollbar styles
                    scrollbarWidth: 'thin', // Firefox
                    scrollbarColor: darkMode ? '#555 #242526' : '#b2dfdb #f0f6ff',
                    msOverflowStyle: 'auto', // IE/Edge
                    position: 'relative',
                }}
                className={darkMode ? 'scrollbar-dark' : 'scrollbar-light'}
                >
                    {selectedRoom ? (
                        messages.length ? (
                            (() => {
                                const timeThreshold = 5 * 60; // 5 phút
                                let lastTimestamp = null;
                                return [
                                    ...messages.map((msg, idx) => {
                                        const current = new Date(msg.timestamp);
                                        let showTime = false;
                                        if (!lastTimestamp || (current - lastTimestamp) / 1000 > timeThreshold) {
                                            showTime = true;
                                            lastTimestamp = current;
                                        }
                                        return (
                                            <React.Fragment key={idx}>
                                                {showTime && (
                                                    <div style={{textAlign: "center", color: "#888", fontSize: 13, margin: "12px 0 4px 0"}}>
                                                        {formatTimeAgo(msg.timestamp)}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        marginBottom: 8,
                                                        display: "flex",
                                                        justifyContent: msg.senderId === currentUser.profileId ? "flex-end" : "flex-start",
                                                        position: "relative"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            background: msg.senderId === currentUser.profileId ? "#DCF8C6" : (darkMode ? "#3a3b3c" : "#f1f0f0"),
                                                            padding: "8px 12px",
                                                            borderRadius: 12,
                                                            maxWidth: "60%",
                                                            textAlign: msg.senderId === currentUser.profileId ? "right" : "left",
                                                            color: msg.senderId === currentUser.profileId ? "#18191A" : (darkMode ? "#f0f6ff" : "#18191A"),
                                                            position: "relative",
                                                            cursor: "pointer"
                                                        }}
                                                        onDoubleClick={() => toggleDetail(idx)}
                                                        onMouseEnter={() => setDetailedMsgIdx(prev => prev.includes('hover'+idx) ? prev : [...prev, 'hover'+idx])}
                                                        onMouseLeave={() => setDetailedMsgIdx(prev => prev.filter(i => i !== 'hover'+idx))}
                                                    >
                                                        <b>{msg.senderId === currentUser.profileId ? "Me" : selectedRoom.recipientName}:</b> {msg.content}
                                                        {detailedMsgIdx.includes(idx) && (
                                                            <div style={{fontSize: 12, color: "#888", marginTop: 4, textAlign: "right"}}>
                                                                {new Date(msg.timestamp).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    }),
                                    // Thêm ref ở cuối danh sách tin nhắn
                                    <div key="end" ref={messagesEndRef} />
                                ];
                            })()
                        ) : (
                            <div style={{color: darkMode ? "#f0f6ff" : "#18191A"}}>Chưa có tin nhắn nào.</div>
                        )
                    ) : (
                        <div style={{color: darkMode ? "#f0f6ff" : "#18191A"}}>Chọn phòng chat hoặc người dùng để bắt đầu.</div>
                    )}
                </div>
                {/* Form gửi tin nhắn */}
                {selectedRoom && (
                    <form onSubmit={handleSendMessage}
                          style={{
                              display: "flex",
                              padding: 8,
                              borderTop: "1px solid #eee",
                              background: "transparent" // nền trong su��t
                          }}>
                        {/* Nút emoji */}
                        <button type="button"
                                ref={emojiBtnRef}
                                onClick={() => setShowEmojiPicker(v => !v)}
                                style={{
                                    background: darkMode ? "#333" : "#fff",
                                    border: "none",
                                    borderRadius: 20,
                                    marginRight: 8,
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 22,
                                    cursor: "pointer",
                                    color: darkMode ? "#43a047" : "#388e3c",
                                    boxShadow: "0 1px 4px rgba(76,175,80,0.08)"
                                }}
                                tabIndex={-1}
                        >
                            <FaSmile />
                        </button>
                        {/* Emoji picker popup */}
                        {showEmojiPicker && (
                            <div
                                ref={emojiPickerRef}
                                className={darkMode ? 'emoji-scrollbar-dark' : 'emoji-scrollbar'}
                                style={{
                                    position: "absolute",
                                    bottom: 56,
                                    left: 0,
                                    background: darkMode ? "#222" : "#fff",
                                    border: "1.5px solid #b2dfdb",
                                    borderRadius: 12,
                                    boxShadow: "0 4px 16px rgba(76,175,80,0.12)",
                                    padding: 10,
                                    zIndex: 2000,
                                    display: "flex",
                                    flexDirection: "column",
                                    width: 260,
                                    maxHeight: 220,
                                    overflowY: "auto"
                                }}
                            >
                                {/* Tabs chọn loại emoji */}
                                <div style={{display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap'}}>
                                    {emojiCategoryNames.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedEmojiCategory(cat)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                border: 'none',
                                                background: selectedEmojiCategory === cat ? (darkMode ? '#43a047' : '#b2dfdb') : 'transparent',
                                                color: selectedEmojiCategory === cat ? (darkMode ? '#fff' : '#222') : (darkMode ? '#b0bec5' : '#607d8b'),
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontSize: 14
                                            }}
                                        >{cat}</button>
                                    ))}
                                </div>
                                {/* Danh sách emoji theo loại */}
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, overflowY: 'auto'}}>
                                    {emojiCategories[selectedEmojiCategory].map((emoji, i) => (
                                        <span key={i}
                                              style={{fontSize: 22, cursor: "pointer", padding: 4, borderRadius: 6, transition: "background 0.2s"}}
                                              onClick={() => addEmoji(emoji)}
                                              onMouseOver={e => e.currentTarget.style.background = darkMode ? '#333' : '#e0f2f1'}
                                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >{emoji}</span>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                background: darkMode ? "#3a3b3c" : "#f1f8e9",
                                color: darkMode ? "#f0f6ff" : "#18191A"
                            }}
                        />
                        <button type="submit"
                                style={{
                                    background: "#66bb6a",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
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
            {showOnlineUsers && (
                <div style={{flex: 1, borderLeft: "none", overflowY: "auto", borderRadius: "18px", border: "none", boxShadow: "0 8px 32px 0 rgba(25, 118, 210, 0.28)", background: darkMode ? "#242526" : "#f0f6ff", transition: "box-shadow 0.3s"}}>
                    <h3 style={{textAlign: "center", color: darkMode ? "#f0f6ff" : "#18191A"}}>Online Users</h3>
                    <ul style={{listStyle: "none", padding: 0}}>
                        {onlineUsers.map((user, idx) => (
                            <li
                                key={user.profileId || idx}
                                style={{padding: "10px", cursor: "pointer", color: darkMode ? "#f0f6ff" : "#18191A"}}
                                onClick={() => handleUserClick(user)}
                            >
                                {user.firstName + " " + user.lastName || user.profileId}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Custom scrollbar CSS cho dark/light mode và emoji picker
const style = document.createElement('style');
style.innerHTML = `
.scrollbar-dark::-webkit-scrollbar {
  width: 10px;
  background: #242526;
  border-radius: 8px;
}
.scrollbar-dark::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 8px;
  border: 2px solid #242526;
}
.scrollbar-light::-webkit-scrollbar {
  width: 10px;
  background: #f0f6ff;
  border-radius: 8px;
}
.scrollbar-light::-webkit-scrollbar-thumb {
  background: #b2dfdb;
  border-radius: 8px;
  border: 2px solid #f0f6ff;
}
.emoji-scrollbar::-webkit-scrollbar {
  width: 8px;
  background: #e0f2f1;
  border-radius: 8px;
}
.emoji-scrollbar::-webkit-scrollbar-thumb {
  background: #b2dfdb;
  border-radius: 8px;
  border: 2px solid #e0f2f1;
}
.emoji-scrollbar-dark::-webkit-scrollbar {
  width: 8px;
  background: #222;
  border-radius: 8px;
}
.emoji-scrollbar-dark::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 8px;
  border: 2px solid #222;
}
`;
document.head.appendChild(style);

export default Chat;
