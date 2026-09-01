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
};

export type ProductCreateBody = {
  name: string;
  description: string;
  priceSom: string;
  stockQuantity: string;
};

export type ApiErrorBody = {
  error: string;
};
