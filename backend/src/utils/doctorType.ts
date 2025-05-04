import z from "zod";

export function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric"
};
return date.toLocaleDateString("en-US", options);
}

export const signupSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    specialization: z.string().min(3, "Specialization must be specified"),
})

export const signinSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

export const availabilitySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format. Use YYYY-MM-DD." }),
    slots: z.array(
        z.object({
            start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid start time format (HH:MM)." }),
            end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid end time format (HH:MM)." })
        })
    ).nonempty({ message: "At least one slot must be specified." })
});

export const appointmentUpdateSchema = z.object({
    appointmentId: z.string().min(1, "Appointment ID is required."),
    stat: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
        errorMap: () => ({ message: "Invalid status. Use 'PENDING', 'CONFIRMED', 'COMPLETED', or 'CANCELLED'." })
    })
});