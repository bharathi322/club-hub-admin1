import bcrypt from "bcryptjs";

const run = async () => {
  const hash = await bcrypt.hash("Admin@2024", 10);
  console.log(hash);
};

run();