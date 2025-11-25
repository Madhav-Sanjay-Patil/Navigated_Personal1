import React from "react";
import { Button } from "react-bootstrap";

const Page404 = () => {
    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
            }}
        >
            <div style={{ fontSize: "34px" }}>Page 404</div>
            <Button onClick={handleLogout}>Back to Login</Button>
        </div>
    );
};

export default Page404;
