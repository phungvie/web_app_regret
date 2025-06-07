import React from "react";

const OnlineUserList = ({ onlineUsers, handleUserClick, darkMode }) => (
    <div style={{
        flex: 1,
        borderLeft: "none",
        overflowY: "auto",
        borderRadius: "18px",
        border: "none",
        boxShadow: "0 8px 32px 0 rgba(25, 118, 210, 0.28)",
        background: darkMode ? "#242526" : "#f0f6ff",
        transition: "box-shadow 0.3s"
    }}>
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
);

export default OnlineUserList;

