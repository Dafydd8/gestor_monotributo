import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

type RegisterUserInput = {
  cuit: string;
  full_name: string;
  password: string;
};

export const registerUser = async ({
  cuit,
  full_name,
  password,
}: RegisterUserInput) => {
  if (!cuit || !full_name || !password) {
    throw new Error("MISSING_FIELDS");
  }

  const existingUser = await prisma.user.findUnique({
    where: { cuit },
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      cuit,
      full_name,
      password_hash,
    },
  });

  const token = jwt.sign(
    { userId: user.id, cuit: user.cuit },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    message: "Usuario creado correctamente",
    token,
    user: {
      id: user.id,
      cuit: user.cuit,
      full_name: user.full_name,
    },
  };
};

export const loginUser = async ({
  cuit,
  password,
}: {
  cuit: string;
  password: string;
}) => {
  if (!cuit || !password) {
    throw new Error("MISSING_FIELDS");
  }

  const user = await prisma.user.findUnique({
    where: { cuit },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    { userId: user.id, cuit: user.cuit },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    message: "Login correcto",
    token,
    user: {
      id: user.id,
      cuit: user.cuit,
      full_name: user.full_name,
    },
  };
};