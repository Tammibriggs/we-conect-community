const { Permit } = require("permitio");

const permit = new Permit({
  pdp: process.env.PERMIT_IO_PDP_URL,
  token: process.env.PERMIT_IO_API_KEY,
});

export default permit;
