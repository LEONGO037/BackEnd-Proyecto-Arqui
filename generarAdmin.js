import bcrypt from "bcrypt";

const generarHash = async () => {
  const hash = await bcrypt.hash("estu123456", 10);
  console.log("HASH GENERADO:\n");
  console.log(hash);
};

generarHash();