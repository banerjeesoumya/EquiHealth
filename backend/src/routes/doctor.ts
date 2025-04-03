import { Hono } from "hono";
import z from "zod";
import { Prisma, PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";

export const doctorRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string
        JWT_SECRET: string
    }, Variables: {
        doctorId: string
        role: string
    }
}>();

function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric"
};
return date.toLocaleDateString("en-US", options);
}

const signupSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    specialization: z.string().min(3, "Specialization must be specified"),
})

const signinSchema = z.object({
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

doctorRouter.post("/signup", async(c) => {
    const prisma  = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const correctSignUpBody = signupSchema.safeParse(body);

    if(!correctSignUpBody.success){
        const errorMessage = correctSignUpBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({
            message: errorMessage
        })
    }

    try {
        const doctorExists = await prisma.doctor.findUnique({
            where:{
                email: body.email
            }
        });

        if (doctorExists) {
            c.status(400);
            return c.json({
                message: "Email already in use"
            })
        }

        const doctor = await prisma.doctor.create({
            data:{
                email: body.email,
                name: body.name,
                password: body.password,
                specialization: body.specialization
            }
        })

        const token = await sign({
            id: doctor.id
        }, c.env.JWT_SECRET);

        c.status(200);
        return c.json({
            message: "Sign up succesfull",
            token: token
        })
    } catch (e) {
        c.status(500);
        return c.json({
            message: "Internal server error"
        })
    }
})


doctorRouter.post("/signin", async(c) => {
    const prisma  = new  PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const correctSignInBody = signinSchema.safeParse(body);

    if (!correctSignInBody.success) {
        const errorMessage = correctSignInBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({
            message: errorMessage
        })
    }

    try {
        const doctor = await prisma.doctor.findUnique({
            where: {
                email: body.email,
                password: body.password
            }
        });

        if (!doctor) {
            c.status(400);
            return c.json({
                message: "Invalid email or password. Please create an account"
            })
        }

        const token = await sign({
            id: doctor.id,
            role: doctor.role
        }, c.env.JWT_SECRET);

        c.status(200);
        return c.json({
            message: "Signed in successfully",
            token: token
        })
    } catch (e) {
        c.status(500);
        return c.json({
            message: "Internal server error"
        })
    }
})

doctorRouter.use("/*", async(c, next) => {
    const authHeader = c.req.header("Authorization") || "";
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== 'Bearer' || !token) {
            c.status(401);
            return c.json({
                message: "Unauthorized"
            })
        }
    
        try {
            const decode = await verify(token, c.env.JWT_SECRET);
            if (decode) {
                c.set('doctorId', String(decode.id));
                c.set("role", String(decode.role));
                await next();
            } else {
                c.status(401);
                return c.json({
                    message: "You are not logged in. Please log in to continue"
                })
            }
        } catch (e) {
            c.status(401);
            return c.json({
                message: "You are not logged in. Please log in to continue"
            })
        }
})

doctorRouter.get("/profile", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    // @ts-ignore
    const doctorId = c.get("doctorId");

    try {
        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

        if (!doctor) {
            c.status(404);
            return c.json({ message: "Doctor not found. Please login first" });
        }

        c.status(200);
        return c.json({
            message: "Doctor profile found successfully",
            doctor: {
                email: doctor.email,
                name: doctor.name,
                specialization: doctor.specialization,
                createdAt: formatDate(doctor.createdAt),
                updatedAt: formatDate(doctor.updatedAt),
            },
        });
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});

doctorRouter.post("/availability", async (c) => {
    const prisma = new PrismaClient({ datasourceUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
    const doctorId = c.get("doctorId");
    const body = await c.req.json();

    console.log("🔹 Received request for doctor availability update");
    console.log("🔹 Extracted doctorId:", doctorId);
    console.log("🔹 Received body:", body);

    const validSlots = availabilitySchema.safeParse(body);
    if (!validSlots.success) {
        console.error("❌ Validation failed:", validSlots.error.errors);
        c.status(400);
        return c.json({ message: validSlots.error.errors.map(e => e.message) });
    }

    const inputDate = new Date(body.date);
    console.log("🔹 Converted input date:", inputDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate < today) {
        console.warn("⚠️ Attempt to set availability for past date:", inputDate);
        c.status(400);
        return c.json({ message: "You cannot set availability for a past date." });
    }

    try {
        console.log("🔍 Checking if doctor exists...");
        const existingDoctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

        if (!existingDoctor) {
            console.error("❌ Doctor not found:", doctorId);
            c.status(404);
            return c.json({ message: "Doctor not found" });
        }

        console.log("✅ Doctor exists, proceeding to check availability...");

        // Fetch existing booked appointments for this doctor on the given date
        console.log("🔍 Fetching booked appointments...");
        const bookedAppointments = await prisma.appointment.findMany({
            where: { doctorId, date: inputDate },
            select: { slot: true }
        });

        const bookedSlots = bookedAppointments.map(app => app.slot);
        console.log("⛔ Booked slots:", bookedSlots);

        // Fetch existing availability
        const existingAvailability = await prisma.doctorAvailability.findUnique({
            where: { doctorId_date: { doctorId, date: inputDate } }
        }) as any;

        console.log("🟢 Existing availability:", existingAvailability);

        // Merge new slots while ensuring no duplication
        let mergedSlots = existingAvailability ? [...existingAvailability.slots, ...body.slots] : body.slots;

        console.log("🔄 Merging slots...", mergedSlots);

        // **Remove slots that are already booked**
        mergedSlots = mergedSlots.filter((slot : any) => !bookedSlots.includes(slot.start));

        console.log("✅ Filtered available slots (removed booked ones):", mergedSlots);

        // **Sort and check for overlapping slots**
        mergedSlots.sort((a: any, b: any) => a.start.localeCompare(b.start));

        for (let i = 0; i < mergedSlots.length - 1; i++) {
            let current = mergedSlots[i];
            let next = mergedSlots[i + 1];

            if (next.start < current.end) {
                console.warn("⚠️ Overlapping slots detected:", current, next);
                c.status(400);
                return c.json({ message: `Overlapping slots detected: ${current.start}-${current.end} & ${next.start}-${next.end}` });
            }
        }

        console.log("✅ No overlapping slots detected, proceeding...");

        // **Update or create availability**
        let availability;
        if (existingAvailability) {
            console.log("🔄 Updating existing availability...");
            availability = await prisma.doctorAvailability.update({
                where: { doctorId_date: { doctorId, date: inputDate } },
                data: { slots: mergedSlots },
            });
        } else {
            console.log("🆕 Creating new availability...");
            availability = await prisma.doctorAvailability.create({
                data: { doctorId, date: inputDate, slots: mergedSlots },
            });
        }

        console.log("✅ Availability operation successful:", availability);

        c.status(200);
        return c.json({ message: "Availability set successfully", availability });
    } catch (e) {
        console.error("❌ Error in availability operation:", e);

        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            console.error("📛 Prisma Error Code:", e.code);
            console.error("📛 Prisma Error Meta:", e.meta);
        }

        c.status(500);
        return c.json({ message: "Internal Server Error", error: e });
    }
});

doctorRouter.delete("/availability", async (c) => {
    const prisma = new PrismaClient({ datasourceUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
    const doctorId = c.get("doctorId");
    const body = await c.req.json();

    console.log("🗑️ Received request to delete slots for doctor:", doctorId);
    console.log("🗑️ Request body:", body);

    const { date, slots } = body;

    if (!date || !Array.isArray(slots) || slots.length === 0) {
        c.status(400);
        return c.json({ message: "Invalid request. Provide a valid date and slots array." });
    }

    const inputDate = new Date(date);
    console.log("🔹 Converted input date:", inputDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate < today) {
        console.warn("⚠️ Cannot delete past slots:", inputDate);
        c.status(400);
        return c.json({ message: "You cannot delete slots for a past date." });
    }

    try {
        console.log("🔍 Checking if doctor exists...");
        const existingDoctor = await prisma.doctor.findUnique({
            where: { id: doctorId }
        });

        if (!existingDoctor) {
            console.error("❌ Doctor not found:", doctorId);
            c.status(404);
            return c.json({ message: "Doctor not found" });
        }

        console.log("✅ Doctor found. Checking existing availability...");

        const existingAvailability = await prisma.doctorAvailability.findUnique({
            where: { doctorId_date: { doctorId, date: inputDate } }
        }) as any;

        if (!existingAvailability) {
            console.warn("⚠️ No availability found for this date:", inputDate);
            c.status(404);
            return c.json({ message: "No availability found for this date." });
        }

        console.log("🟢 Existing slots:", existingAvailability.slots);

        // Filter out the slots to be deleted
        const updatedSlots = existingAvailability.slots.filter(
            // @ts-ignore
            (slot) => !slots.some((delSlot) => delSlot.start === slot.start && delSlot.end === slot.end)
        );

        if (updatedSlots.length === existingAvailability.slots.length) {
            console.warn("⚠️ No matching slots found to delete:", slots);
            c.status(400);
            return c.json({ message: "No matching slots found to delete." });
        }

        console.log("🗑️ Updated slots after deletion:", updatedSlots);

        // Update or delete availability record
        if (updatedSlots.length === 0) {
            console.log("🗑️ No slots left, deleting the availability record...");
            await prisma.doctorAvailability.delete({
                where: { doctorId_date: { doctorId, date: inputDate } }
            });
        } else {
            console.log("Updating availability record...");
            await prisma.doctorAvailability.update({
                where: { doctorId_date: { doctorId, date: inputDate } },
                data: { slots: updatedSlots }
            });
        }

        console.log("✅ Slots deleted successfully.");
        c.status(200);
        return c.json({ message: "Slots deleted successfully." });

    } catch (e) {
        console.error("❌ Error in deleting slots:", e);
        c.status(500);
        return c.json({ message: "Internal Server Error", error: e });
    }
});

doctorRouter.get("/availability", async (c) => {
    const prisma = new PrismaClient({ datasourceUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
    const doctorId = c.get("doctorId");

    console.log(`🔍 Fetching all availability slots for Doctor ID: ${doctorId}`);

    try {
        const availability = await prisma.doctorAvailability.findMany({
            where: { doctorId },
            select: { date: true, slots: true },
        });

        if (!availability || availability.length === 0) {
            console.log("❌ No availability found.");
            c.status(404);
            return c.json({ message: "No availability slots found." });
        }

        console.log("🟢 Retrieved availability slots:", availability);

        c.status(200);
        return c.json({ message: "Availability slots retrieved successfully", availability });
    } catch (e) {
        console.error("❌ Error fetching availability slots:", e);
        c.status(500);
        return c.json({ message: "Internal Server Error", error: e });
    }
});


doctorRouter.get("/appointments", async (c) => {
    const prisma = new PrismaClient({ datasourceUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
    const doctorId = c.get("doctorId");

    try {
        const appointments = await prisma.appointment.findMany({ where: { doctorId } });
        c.status(200);
        return c.json({ message: "Appointments retrieved successfully", appointments });
    } catch (e) {
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});
