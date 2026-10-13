"use client";

import { useMockData } from "@/lib/mock-store";

export function useContacts() {
  const { contacts, addContact, updateContact, deleteContact } = useMockData();
  return {
    contacts,
    isLoading: false,
    addContact,
    updateContact,
    deleteContact,
  };
}
