const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../controllers/authController");

const authenticate = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ No token provided.");
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (isTokenBlacklisted(token)) {
        return res.status(403).json({ error: "Unauthorized: Token is blacklisted. Please log in again." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); 
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.map((role) => role.toLowerCase()).includes(req.user.role.toLowerCase())) {
            return res.status(403).json({ error: "Forbidden: You do not have access to this resource" });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRoles };
