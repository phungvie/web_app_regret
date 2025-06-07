import React from "react";
import { FaSmile } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({
    messageInput,
    setMessageInput,
    handleSendMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiBtnRef,
    emojiPickerRef,
    onEmojiClick,
    darkMode
}) => (
    <form onSubmit={handleSendMessage}
          style={{
              display: "flex",
              padding: 8,
              borderTop: "1px solid #eee",
              background: "transparent"
          }}>
        <button type="button"
                ref={emojiBtnRef}
                onClick={() => setShowEmojiPicker(v => !v)}
                style={{
                    background: darkMode ? "#333" : "#fff",
                    border: "none",
                    borderRadius: "20px",
                    marginRight: "8px",
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
            <FaSmile/>
        </button>
        {showEmojiPicker && (
            <div
                ref={emojiPickerRef}
                style={{
                    position: "absolute",
                    bottom: 70,
                    left: 100,
                    zIndex: 2000,
                    boxShadow: "0 12px 48px 0 rgba(25, 118, 210, 0.38), 0 4px 16px 0 rgba(76, 175, 80, 0.22)",
                    borderRadius: 20,
                    background: darkMode ? "#23272f" : "#fff",
                    border: darkMode ? "2px solid #388e3c" : "2px solid #43a047",
                    padding: 6,
                    minWidth: 380,
                    minHeight: 420,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <EmojiPicker theme={darkMode ? 'dark' : 'light'} onEmojiClick={onEmojiClick} height={400} width={360}/>
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
                borderRadius: "20px",
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
                    borderRadius: "8px",
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
);

export default MessageInput;

