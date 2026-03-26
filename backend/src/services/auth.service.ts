import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

type RegisterUserInput = {
  cuit: string;
  full_name: string;
  password: string;
  current_category_id?: number;
};

export const registerUser = async ({
  cuit,
  full_name,
  password,
  current_category_id,
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

  if (current_category_id) {
    const category = await prisma.category.findUnique({
      where: { id: current_category_id },
    });

    if (!category) {
      throw new Error("INVALID_CATEGORY");
    }
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      cuit,
      full_name,
      password_hash,
      current_category_id: current_category_id ?? null,
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
      current_category_id: user.current_category_id,
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

  cuit = cuit.replace(/-/g, "");
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