"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/utils/sentry"; // Adjust the import based on your prisma setup
import * as Sentry from "@sentry/nextjs";

export const createTicket = async (
  prevState: { success: boolean; message: string },
  data: FormData
): Promise<{ success: boolean; message: string }> => {
  try {
    const subject = data.get("subject") as string;
    const description = data.get("description") as string;
    const priority = data.get("priority") as string;

    // Here you would typically send this data to your backend or database
    // For demonstration, we will just log it
    console.log("New Ticket Created:", {
      subject,
      description,
      priority,
    });

    if (!subject || !description || !priority) {
      logEvent(
        "Validation Error: Missing ticket fields",
        "ticket",
        { subject, description, priority },
        "warning"
      );
      return { success: false, message: "All fields are required" };
    }

    //! Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority,
      },
    });

    logEvent(
      `Ticket created successfully: ${ticket.id}`,
      "ticket",
      { ticketId: ticket.id },
      "info"
    );

    revalidatePath("/tickets");

    return { success: true, message: "Ticket created successfully!" };
  } catch (error) {
    logEvent(
      "An error occured while creating the ticket",
      "ticket",
      {
        formData: Object.fromEntries(data.entries()),
      },
      "error",
      error
    );

    return {
      success: false,
      message: "An error occured while creating the ticket",
    };
  }
};

export const getTickets = async () => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });

    logEvent(
      "Fetched ticket list",
      "ticket",
      { count: tickets.length },
      "info"
    );

    return tickets;
  } catch (error) {
    logEvent("Error fetching tickets", "ticket", {}, "error", error);

    return [];
  }
};
