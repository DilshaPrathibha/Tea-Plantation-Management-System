module.exports = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: need role " + roles.join(", ") });
  }
  next();
};
