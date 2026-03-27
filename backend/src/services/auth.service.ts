import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

type RegisterUserInput = {
  cuit: string;
  full_name: string;
  password: string;
  current_category_id?: number;
};

type UpdateCurrentUserInput = {
  userId: number;
  full_name?: string;
  current_category_id?: number | null;
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
    include: {
      current_category: true,
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
      current_category_code: user.current_category?.code ?? null,
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
    include: {
      current_category: true,
    },
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
      current_category_id: user.current_category_id,
      current_category_code: user.current_category?.code ?? null,
    },
  };
};

export const updateCurrentUser = async ({
  userId,
  full_name,
  current_category_id,
}: UpdateCurrentUserInput) => {
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  const data: {
    full_name?: string;
    current_category_id?: number | null;
  } = {};

  if (full_name !== undefined) {
    const trimmedName = full_name.trim();

    if (!trimmedName) {
      throw new Error("INVALID_FULL_NAME");
    }

    data.full_name = trimmedName;
  }

  if (current_category_id !== undefined) {
    if (current_category_id === null) {
      data.current_category_id = null;
    } else {
      const category = await prisma.category.findUnique({
        where: { id: current_category_id },
      });

      if (!category) {
        throw new Error("INVALID_CATEGORY");
      }

      data.current_category_id = current_category_id;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("NOTHING_TO_UPDATE");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      current_category: true,
    },
  });

  return {
    message: "Usuario actualizado correctamente",
    user: {
      id: user.id,
      cuit: user.cuit,
      full_name: user.full_name,
      current_category_id: user.current_category_id,
      current_category_code: user.current_category?.code ?? null,
    },
  };
};