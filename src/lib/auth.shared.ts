import type { StaffRole } from "./roles.shared";

export type StaffLoginBody = {
  email: string;
  password: string;
};

export type StaffSessionPublic = {
  name: string;
  email: string;
  role: StaffRole;
};

export type CustomerRegisterBody = {
  email: string;
  password: string;
  name: string;
};

export type CustomerLoginBody = {
  email: string;
  password: string;
};

export type CustomerPublic = {
  id: string;
  email: string;
  name: string;
  homeAddress: string;
  avatarUrl: string;
};

export type CustomerAuthSuccess = {
  accessToken: string;
  refreshToken: string;
  customer: CustomerPublic;
};

export type ProductPublic = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  categoryId: string | null;
  subcategoryId: string | null;
};

export type ProductCreateBody = {
  name: string;
  description: string;
  priceSom: string;
  costSom: string;
  stockQuantity: string;
  /** Существующая категория, либо пустая строка. */
  categoryId?: string;
  /** Название новой категории (если categoryId пуст). */
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  /**
   * Пустая строка — без фото / убрать фото.
   * data:image… — новое фото; /uploads/products/… — оставить текущее.
   */
  imageUrl?: string;
};

export type ApiErrorBody = {
  error: string;
};
