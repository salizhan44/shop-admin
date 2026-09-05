import { prisma } from "./prisma.server";
import type { CustomerPublic } from "./auth.shared";
import { toCustomerPublic } from "./customer-auth.server";
import {
  validateAvatarUrl,
  validateCustomerName,
  validateHomeAddress,
  type CustomerProfileUpdateBody,
} from "./customer-profile.shared";

export async function getCustomerProfile(
  customerId: string,
): Promise<CustomerPublic | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      name: true,
      homeAddress: true,
      avatarUrl: true,
    },
  });
  if (!customer) {
    return null;
  }
  return toCustomerPublic(customer);
}

export async function updateCustomerProfile(
  customerId: string,
  body: CustomerProfileUpdateBody,
): Promise<{ customer: CustomerPublic } | { error: string }> {
  const data: {
    name?: string;
    homeAddress?: string;
    avatarUrl?: string;
  } = {};

  if (typeof body.name === "string") {
    const nameError = validateCustomerName(body.name);
    if (nameError) {
      return { error: nameError };
    }
    data.name = body.name.trim();
  }

  if (typeof body.homeAddress === "string") {
    const addressError = validateHomeAddress(body.homeAddress);
    if (addressError) {
      return { error: addressError };
    }
    data.homeAddress = body.homeAddress.trim();
  }

  if ("avatarUrl" in body) {
    if (body.avatarUrl === null || body.avatarUrl === "") {
      data.avatarUrl = "";
    } else if (typeof body.avatarUrl === "string") {
      const avatarError = validateAvatarUrl(body.avatarUrl);
      if (avatarError) {
        return { error: avatarError };
      }
      data.avatarUrl = body.avatarUrl;
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "Нечего сохранять" };
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      homeAddress: true,
      avatarUrl: true,
    },
  });

  return { customer: toCustomerPublic(customer) };
}
