import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaHome, FaUserCircle, FaRegCommentDots, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ChatHeader = ({ currentUser, darkMode, setDarkMode }) => {
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        if (!showProfile) return;
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfile]);

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 24px 8px 8px",
            background: darkMode ? "#23272f" : "#e3f2fd",
            borderRadius: 12,
            marginBottom: 8,
            boxShadow: darkMode ? "0 2px 8px 0 rgba(25, 118, 210, 0.10)" : "0 2px 8px 0 rgba(25, 118, 210, 0.18)",
            minHeight: 56,
            position: "relative",
            zIndex: 1200
        }}>
            {/* Nút về trang chủ */}
            <button
                onClick={() => navigate("/")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: darkMode ? "#333" : "#fff",
                    color: darkMode ? "#f0f6ff" : "#1976d2",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 16,
                    boxShadow: "0 1px 4px 0 rgba(25, 118, 210, 0.10)"
                }}
            >
                <FaHome style={{ fontSize: 20 }} />
                Home
            </button>
            {/* Spacer để đẩy các nút bên phải */}
            <div style={{ flex: 1 }} />
            {/* Nút về trang chat bên phải, icon message */}
            <button
                onClick={() => navigate("/chat")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: darkMode ? "#333" : "#fff",
                    color: darkMode ? "#f0f6ff" : "#1976d2",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 16,
                    boxShadow: "0 1px 4px 0 rgba(25, 118, 210, 0.10)",
                    marginRight: 16
                }}
            >
                <FaRegCommentDots style={{ fontSize: 20 }} />
                Chat
            </button>
            {/* Dropdown profile luôn ở cuối cùng */}
            <div ref={profileRef} style={{ position: "relative" }}>
                <button
                    onClick={() => setShowProfile(v => !v)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: darkMode ? "#333" : "#fff",
                        color: darkMode ? "#f0f6ff" : "#1976d2",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 16,
                        boxShadow: "0 1px 4px 0 rgba(25, 118, 210, 0.10)"
                    }}
                >
                    <FaUserCircle style={{ fontSize: 22 }} />
                    {currentUser?.username || "My Profile"}
                    {showProfile ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {showProfile && (
                    <div style={{
                        position: "absolute",
                        right: 0,
                        top: 48,
                        minWidth: 220,
                        background: darkMode ? "#23272f" : "#fff",
                        color: darkMode ? "#f0f6ff" : "#18191A",
                        borderRadius: 10,
                        boxShadow: "0 4px 16px 0 rgba(25, 118, 210, 0.18)",
                        padding: 16,
                        zIndex: 1300
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                            {currentUser?.firstName} {currentUser?.lastName}
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 4 }}>
                            <b>Email:</b> {currentUser?.email}
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 4 }}>
                            <b>Username:</b> {currentUser?.username}
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 4 }}>
                            <b>Status:</b> {currentUser?.status}
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 12 }}>
                            <b>Date of Birth:</b> {currentUser?.dob}
                        </div>
                        <div style={{ borderTop: '1px solid #e0e0e0', margin: '12px 0' }} />
                        {/* Settings section */}
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                            Cài đặt
                        </div>
                        <button
                            onClick={() => setDarkMode(dm => !dm)}
                            style={{
                                width: '100%',
                                background: darkMode ? "#333" : "#e3f2fd",
                                color: darkMode ? "#f0f6ff" : "#18191A",
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 16px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: 16,
                                boxShadow: "0 1px 4px 0 rgba(25, 118, 210, 0.10)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 8
                            }}
                        >
                            {darkMode ? (<FaSun style={{fontSize:18}}/>) : (<FaMoon style={{fontSize:18}}/>) }
                            {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
