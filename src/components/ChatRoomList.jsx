import React from "react";

const ChatRoomList = ({ chatRooms, selectedRoom, setSelectedRoom, darkMode }) => (
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
                        <div style={{
                            width: 38, height: 38,
                            borderRadius: '50%',
                            background: isSelected ? (darkMode ? '#66bb6a' : '#43a047') : (darkMode ? '#333' : '#b2dfdb'),
                            color: isSelected ? '#fff' : (darkMode ? '#fff' : '#388e3c'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}>{avatarText}</div>
                        <div style={{flex: 1, minWidth: 0}}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>{name}</div>
                            <div style={{fontSize: 12, color: darkMode ? '#b0bec5' : '#607d8b', marginTop: 2}}>
                                ID: {room.recipientId}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    </div>
);

export default ChatRoomList;

