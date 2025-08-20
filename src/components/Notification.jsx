import React, { useEffect, useState } from 'react';

const Notification = ({ message, type, onDismiss }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 500);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(onDismiss, 500);
    };

    return (
        <div className={`notification ${type} ${visible ? 'visible' : ''}`}>
            <p>{message}</p>
            <button onClick={handleDismiss} className="close-notification">&times;</button>
        </div>
    );
};

export default Notification;