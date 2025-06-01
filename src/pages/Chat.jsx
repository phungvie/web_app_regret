// Chat.jsx - Giao diện chat với chú thích từng dòng
import React, { useEffect, useState } from "react";
import axios from "axios";

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
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy danh sách phòng chat từ API khi component mount
  useEffect(() => {
    axios.get("/api/chat/rooms")
      .then(res => setChatRooms(res.data.result || []))
      .catch(() => setChatRooms([]));
  }, []);

  // Lấy danh sách user online từ API khi component mount
  useEffect(() => {
    axios.get("/profile/users")
      .then(res => setOnlineUsers(res.data.result || []))
      .catch(() => setOnlineUsers([]));
  }, []);

  // Khi chọn phòng chat, lấy tin nhắn của phòng đó
  useEffect(() => {
    if (selectedRoom) {
      axios.get(`/messages/${selectedRoom.senderId}/${selectedRoom.recipientId}`)
        .then(res => setMessages(res.data.result || []))
        .catch(() => setMessages([]));
    }
  }, [selectedRoom]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    if (!messageInput.trim() || !selectedRoom) return; // Không gửi nếu rỗng hoặc chưa chọn phòng
    const payload = {
      senderId: currentUser?.id || "me", // Lấy id user hiện tại (cần thay bằng auth thực tế)
      recipientId: selectedRoom.recipientId,
      content: messageInput
    };
    await axios.post("/api/chat/send", payload); // Gửi tin nhắn lên server
    setMessageInput(""); // Xóa input
    // Lấy lại danh sách tin nhắn mới
    axios.get(`/messages/${selectedRoom.senderId}/${selectedRoom.recipientId}`)
      .then(res => setMessages(res.data.result || []));
  };

  // Khi click vào user online, tìm hoặc tạo phòng chat với user đó
  const handleUserClick = async (user) => {
    // Tìm phòng chat đã có giữa 2 user
    let room = chatRooms.find(
      r => (r.senderId === currentUser?.id && r.recipientId === user.id) ||
           (r.senderId === user.id && r.recipientId === currentUser?.id)
    );
    if (!room) {
      // Nếu chưa có thì tạo mới (chỉ tạo UI, thực tế tạo khi gửi tin nhắn đầu tiên)
      room = { senderId: currentUser?.id, recipientId: user.id, name: user.name };
      setChatRooms(prev => [...prev, room]);
    }
    setSelectedRoom(room); // Chọn phòng chat
  };

  return (
    <div style={{ display: "flex", height: "80vh", border: "1px solid #ccc" }}>
      {/* Bên trái: Danh sách phòng chat */}
      <div style={{ flex: 1, borderRight: "1px solid #eee", overflowY: "auto" }}>
        <h3 style={{ textAlign: "center" }}>Chat Rooms</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
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
              {room.name || room.recipientId}
            </li>
          ))}
        </ul>
      </div>
      {/* Ở giữa: Hiển thị tin nhắn và gửi tin nhắn */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {selectedRoom ? (
            messages.length ? (
              messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <b>{msg.senderId === currentUser?.id ? "Me" : msg.senderId}:</b> {msg.content}
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
          <form onSubmit={handleSendMessage} style={{ display: "flex", padding: 8, borderTop: "1px solid #eee" }}>
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{ flex: 1, marginRight: 8 }}
            />
            <button type="submit">Gửi</button>
          </form>
        )}
      </div>
      {/* Bên phải: Danh sách user online */}
      <div style={{ flex: 1, borderLeft: "1px solid #eee", overflowY: "auto" }}>
        <h3 style={{ textAlign: "center" }}>Online Users</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {onlineUsers.map((user, idx) => (
            <li
              key={user.id || idx}
              style={{ padding: "10px", cursor: "pointer" }}
              onClick={() => handleUserClick(user)}
            >
              {user.name || user.id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chat;

