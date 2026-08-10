const crypto = require("crypto");

// generate human readable IDs like GYM-A3F9-7
const generateUniqueMemberId = () => {
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  const checksum =
    randomPart.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    10;

  return `GYM-${randomPart}-${checksum}`;
};

module.exports = { generateUniqueMemberId };
