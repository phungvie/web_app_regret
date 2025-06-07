import React from "react";

const MessageList = ({ messages, currentUser, selectedRoom, darkMode, detailedMsgIdx, toggleDetail, formatTimeAgo, messagesEndRef, replaceEmoticonsWithEmoji, setDetailedMsgIdx }) => (
    <div
        style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode ? '#555 #242526' : '#b2dfdb #f0f6ff',
            msOverflowStyle: 'auto',
            position: 'relative',
        }}
        className={darkMode ? 'scrollbar-dark' : 'scrollbar-light'}
    >
        {selectedRoom ? (
            messages.length ? (
                (() => {
                    const timeThreshold = 5 * 60;
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
                                        <div style={{
                                            textAlign: "center",
                                            color: "#888",
                                            fontSize: 13,
                                            margin: "12px 0 4px 0"
                                        }}>
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
                                            onMouseEnter={() => setDetailedMsgIdx(prev => prev.includes('hover' + idx) ? prev : [...prev, 'hover' + idx])}
                                            onMouseLeave={() => setDetailedMsgIdx(prev => prev.filter(i => i !== 'hover' + idx))}
                                        >
                                            <b>{msg.senderId === currentUser.profileId ? "Me" : selectedRoom.recipientName}:</b> <span dangerouslySetInnerHTML={{__html: replaceEmoticonsWithEmoji(msg.content)}} />
                                            {detailedMsgIdx.includes(idx) && (
                                                <div style={{
                                                    fontSize: 12,
                                                    color: "#888",
                                                    marginTop: 4,
                                                    textAlign: "right"
                                                }}>
                                                    {new Date(msg.timestamp).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        }),
                        <div key="end" ref={messagesEndRef}/>
                    ];
                })()
            ) : (
                <div style={{color: darkMode ? "#f0f6ff" : "#18191A"}}>Chưa có tin nhắn nào.</div>
            )
        ) : (
            <div style={{color: darkMode ? "#f0f6ff" : "#18191A"}}>Chọn phòng chat hoặc người dùng để bắt đầu.</div>
        )}
    </div>
);

export default MessageList;

