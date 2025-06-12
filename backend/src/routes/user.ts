import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify, decode } from "hono/jwt";
import axios from "axios";
import OpenAI from "openai";
import twilio from "twilio";
import { appointmentSchema, chatSupportSchema, formatDate, predictionSchema, signInSchema, signUpSchema, specializationSchema, updateSchema } from "../utils/userType";
import { getFoodInfo, calculateHealthScore, checkDietaryCompatibility } from "../utils/api";
import { callMemoryStore } from "../utils/CallType";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
        FLASK_SERVICE: string
        OPENROUTER_API_KEY: string
        OPENROUTER_BASE_URL: string
        SENDGRID_API_KEY: string
        TWILIO_ACCOUNT_SID: string
        TWILIO_AUTH_TOKEN: string
        TWILIO_PHONE_NUMBER: string
        BASE_URL: string
    }, Variables:{
        userId: string
        role: string
    }
}>();


userRouter.post("/signup", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const correctSignUpBody = signUpSchema.safeParse(body);
    if (!correctSignUpBody.success) {
        const errorMessage = correctSignUpBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({
            message: errorMessage
        })
    }

    try{
        const userExists = await prisma.user.findUnique({
            where:{
                email: body.email
            }
        })
        if (userExists) {
            c.status(400);
            return c.json({
                message: "Email already in use"
            })
        } else {
            const user = await prisma.user.create({
                data:{
                    email: body.email,
                    name: body.name,
                    password: body.password,
                    age: body.age,
                    height: body.height,
                    weight: body.weight,
                    gender: body.gender,
                }
            })
            const token = await sign({
                id: user.id
            }, c.env.JWT_SECRET,);

            c.status(200);
            return c.json({
                message: "Sign up successful",
                token: token,
                user:{
                    email: user.email,
                    name: user.name,
                    age: user.age,
                    height: user.height,
                    weight: user.weight,
                }
            })
        }
    } catch (e) {
        console.log(e);
        c.status(400);
        return c.json({
            message: "Error while signing up. Internal Server Error"
        })
    } 
})

userRouter.post("/signin", async (c) => {
    // Just signing in the user
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const correctSignInBody = signInSchema.safeParse(body);
    if (!correctSignInBody.success) {
        const errorMessage = correctSignInBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({
            message: errorMessage
        })
    }

    try {
        const user = await prisma.user.findUnique({
            where:{
                email: body.email,
                password: body.password
            }
        });
        if (!user) {
            c.status(400);
            return c.json({
                message: "User doesn't exist. Please create an account"
            })
        }
        const token = await sign({
            id: user.id,
            role: user.role
        }, c.env.JWT_SECRET);
        c.status(200);
        return c.json({
            message: "Signed in successfully",
            token: token,
            user:{
                email: user.email,
                name: user.name,
                age: user.age,
                height: user.height,
                weight: user.weight,
            }
        })
    } catch (e) {
        c.status(400);
        return c.json({
            message: "Error while signing in. Internal Server Error"
        })
    }
})

// Place all IVR routes here (initiate-phone-booking, handle-specialization-choice, handle-doctor-choice, handle-date-choice, handle-slot-choice, confirm-appointment)
userRouter.post("/initiate-phone-booking", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const { phoneNumber, userId } = await c.req.json();
    console.log("[initiate-phone-booking] userId:", userId, "phoneNumber:", phoneNumber);

    if (!phoneNumber || !userId) {
        c.status(400);
        return c.json({ message: "Phone number and userId are required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        console.log("[initiate-phone-booking] user:", user);

        if (!user) {
            c.status(404);
            return c.json({ message: "User not found" });
        }

        // Initialize Twilio client
        const twilioClient = twilio(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN);

        // Create a call with TwiML for interactive voice response
        const call = await twilioClient.calls.create({
            to: phoneNumber,
            from: c.env.TWILIO_PHONE_NUMBER,
            twiml: `
                <Response>
                    <Gather numDigits="1" action="${c.env.BASE_URL}/api/v1/user/handle-specialization-choice" method="POST">
                        <Say>Welcome to EquiHealth appointment booking system. Please select a specialization by pressing the corresponding number.</Say>
                        <Say>Press 1 for General Medicine</Say>
                        <Say>Press 2 for Cardiology</Say>
                        <Say>Press 3 for Neurology</Say>
                        <Say>Press 4 for Orthopedics</Say>
                        <Say>Press 5 for Pediatrics</Say>
                        <Say>Press 6 for Dermatology</Say>
                    </Gather>
                </Response>
            `
        });
        console.log("[initiate-phone-booking] Twilio call initiated:", call.sid);
        c.status(200);
        callMemoryStore[call.sid] = { userId }
        return c.json({
            message: "Call initiated successfully",
            callSid: call.sid
        });
    } catch (error: any) {
        console.error("Error initiating call:", error);
        c.status(500);
        return c.json({
            message: "Error initiating call",
            error: error.message
        });
    }
});

userRouter.post("/handle-specialization-choice", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const formData1 = await c.req.parseBody() as Record<string, string | File>;
    const Digits = typeof formData1["Digits"] === "string" ? formData1["Digits"] : "";
    const CallSid = typeof formData1["CallSid"] === "string" ? formData1["CallSid"] : "";
    console.log("[handle-specialization-choice] CallSid:", CallSid, "Digits:", Digits);
    const specializationMap: { [key: string]: string } = {
        "1": "General Medicine",
        "2": "Cardiology",
        "3": "Neurology",
        "4": "Orthopedics",
        "5": "Pediatrics",
        "6": "Dermatology"
    };

    const specialization = specializationMap[Digits];
    console.log("[handle-specialization-choice] specialization:", specialization);
    if (!specialization) {
        return c.text(`
            <Response>
                <Say>Invalid selection. Please try again.</Say>
                <Redirect method="POST">${c.env.BASE_URL}/api/v1/user/initiate-phone-booking</Redirect>
            </Response>
        `);
    }
    callMemoryStore[CallSid].specialization = specialization;
    try {
        // Get available doctors for the selected specialization
        const doctors = await prisma.doctor.findMany({
            where: { specialization },
            select: { id: true, name: true }
        });
        console.log("[handle-specialization-choice] doctors:", doctors);

        // Defensive: filter out doctors with empty names
        const filteredDoctors = doctors.filter(doctor => doctor.name && doctor.name.trim() !== "");
        if (!filteredDoctors.length) {
            return c.text(`
                <Response>
                    <Say>No doctors available for ${specialization}. Please try another specialization.</Say>
                    <Redirect method="POST">${c.env.BASE_URL}/api/v1/user/initiate-phone-booking</Redirect>
                </Response>
            `);
        }
        let doctorOptions = filteredDoctors
            .map((doctor, index) => `<Say>Press ${index + 1} for Doctor ${doctor.name}</Say>`)
            .join('');
        const twiml = [
            '<Response>',
            `<Gather numDigits="1" action="${c.env.BASE_URL}/api/v1/user/handle-doctor-choice" method="POST">`,
            '<Say>Please select a doctor by pressing the corresponding number.</Say>',
            doctorOptions,
            '</Gather>',
            '</Response>'
        ].join('');
        console.log("[handle-specialization-choice] TwiML sent:\n", twiml);
        return c.text(twiml);
    } catch (error: any) {
        console.error("Error handling specialization choice:", error);
        return c.text(`
            <Response>
                <Say>An error occurred. Please try again later.</Say>
                <Hangup/>
            </Response>
        `);
    }
});

userRouter.post("/handle-doctor-choice", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const formData2 = await c.req.parseBody() as Record<string, string | File>;
    const Digits = typeof formData2["Digits"] === "string" ? formData2["Digits"] : "";
    const CallSid = typeof formData2["CallSid"] === "string" ? formData2["CallSid"] : "";
    console.log("[handle-doctor-choice] CallSid:", CallSid, "Digits:", Digits);

    // Get doctor list from memory (set in previous step)
    const specialization = callMemoryStore[CallSid]?.specialization;
    console.log("[handle-doctor-choice] specialization from memory:", specialization);
    if (!specialization) {
        return c.text(`<Response><Say>Session expired or invalid. Please start again.</Say><Hangup/></Response>`);
    }
    // Fetch doctors for the specialization
    const doctors = await prisma.doctor.findMany({
        where: { specialization },
        select: { id: true, name: true }
    });
    console.log("[handle-doctor-choice] doctors:", doctors);
    const doctorIndex = parseInt(Digits) - 1;
    if (doctorIndex < 0 || doctorIndex >= doctors.length) {
        return c.text(`<Response><Say>Invalid doctor selection. Please try again.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-specialization-choice</Redirect></Response>`);
    }
    const selectedDoctor = doctors[doctorIndex];
    callMemoryStore[CallSid].doctorId = selectedDoctor.id;
    console.log("[handle-doctor-choice] selectedDoctor:", selectedDoctor);

    // Fetch available dates for this doctor (dates with available slots)
    const today = new Date();
    const availabilities = await prisma.doctorAvailability.findMany({
        where: { doctorId: selectedDoctor.id, date: { gte: today } },
        select: { date: true, slots: true },
        orderBy: { date: 'asc' }
    });
    console.log("[handle-doctor-choice] availabilities:", availabilities);
    if (!availabilities.length) {
        return c.text(`<Response><Say>No available dates for this doctor. Please try another doctor.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-specialization-choice</Redirect></Response>`);
    }
    // Only show up to 7 dates
    const availableDates = availabilities.slice(0, 7).map(a => a.date);
    let dateOptions = availableDates.map((date, index) =>
        `<Say>Press ${index + 1} for ${new Date(date).toLocaleDateString()}</Say>`
    ).join('');
    // Store availableDates in memory for next step
    callMemoryStore[CallSid].availableDates = availableDates.map(d => d.toISOString());
    console.log("[handle-doctor-choice] availableDates:", availableDates);
    return c.text(`<Response><Gather numDigits="1" action="${c.env.BASE_URL}/api/v1/user/handle-date-choice" method="POST"><Say>Please select a date by pressing the corresponding number.</Say>${dateOptions}</Gather></Response>`);
});

userRouter.post("/handle-date-choice", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const formData3 = await c.req.parseBody() as Record<string, string | File>;
    const Digits = typeof formData3["Digits"] === "string" ? formData3["Digits"] : "";
    const CallSid = typeof formData3["CallSid"] === "string" ? formData3["CallSid"] : "";
    console.log("[handle-date-choice] CallSid:", CallSid, "Digits:", Digits);

    const doctorId = callMemoryStore[CallSid]?.doctorId;
    const availableDates = callMemoryStore[CallSid]?.availableDates;
    console.log("[handle-date-choice] doctorId:", doctorId, "availableDates:", availableDates);
    if (!doctorId || !availableDates) {
        return c.text(`<Response><Say>Session expired or invalid. Please start again.</Say><Hangup/></Response>`);
    }
    const dateIndex = parseInt(Digits) - 1;
    if (dateIndex < 0 || dateIndex >= availableDates.length) {
        return c.text(`<Response><Say>Invalid date selection. Please try again.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-doctor-choice</Redirect></Response>`);
    }
    const selectedDate = availableDates[dateIndex];
    callMemoryStore[CallSid].date = selectedDate;
    console.log("[handle-date-choice] selectedDate:", selectedDate);

    // Fetch available slots for this doctor and date
    const doctorAvailability = await prisma.doctorAvailability.findFirst({
        where: { doctorId, date: new Date(selectedDate) }
    });
    console.log("[handle-date-choice] doctorAvailability:", doctorAvailability);
    if (!doctorAvailability || !Array.isArray(doctorAvailability.slots) || doctorAvailability.slots.length === 0) {
        return c.text(`<Response><Say>No available slots for this date. Please try another date.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-doctor-choice</Redirect></Response>`);
    }

    // Fetch all appointments for this doctor and date (not cancelled)
    const bookedAppointments = await prisma.appointment.findMany({
        where: {
            doctorId,
            date: new Date(selectedDate),
            status: { not: "CANCELLED" }
        },
        select: { slot: true }
    });
    const bookedSlots = bookedAppointments.map(a => a.slot);

    // Only show up to 7 slots, filter out already booked slots
    const slots = doctorAvailability.slots
        .filter((slot: any) => {
            if (slot && typeof slot === 'object' && 'start' in slot) {
                return !bookedSlots.includes(slot.start);
            }
            return false;
        })
        .slice(0, 7);

    let slotOptions = slots
        .map((slot, index) =>
            (slot && typeof slot === 'object' && 'start' in slot)
                ? `<Say>Press ${index + 1} for ${slot.start}</Say>`
                : ''
        ).join('');
    // Store slots in memory for next step
    callMemoryStore[CallSid].slots = slots;
    console.log("[handle-date-choice] slots:", slots);
    if (slots.length === 0) {
        return c.text(`<Response><Say>No available slots for this date. Please try another date.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-doctor-choice</Redirect></Response>`);
    }
    return c.text(`<Response><Gather numDigits="1" action="${c.env.BASE_URL}/api/v1/user/handle-slot-choice" method="POST"><Say>Please select a time slot by pressing the corresponding number.</Say>${slotOptions}</Gather></Response>`);
});

userRouter.post("/handle-slot-choice", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const formData4 = await c.req.parseBody() as Record<string, string | File>;
    const Digits = typeof formData4["Digits"] === "string" ? formData4["Digits"] : "";
    const CallSid = typeof formData4["CallSid"] === "string" ? formData4["CallSid"] : "";
    console.log("[handle-slot-choice] CallSid:", CallSid, "Digits:", Digits);

    const slots = callMemoryStore[CallSid]?.slots;
    console.log("[handle-slot-choice] slots from memory:", slots);
    if (!slots) {
        return c.text(`<Response><Say>Session expired or invalid. Please start again.</Say><Hangup/></Response>`);
    }
    const slotIndex = parseInt(Digits) - 1;
    if (slotIndex < 0 || slotIndex >= slots.length) {
        return c.text(`<Response><Say>Invalid slot selection. Please try again.</Say><Redirect method="POST">${c.env.BASE_URL}/api/v1/user/handle-date-choice</Redirect></Response>`);
    }
    const selectedSlot = slots[slotIndex];
    callMemoryStore[CallSid].slot = typeof selectedSlot === 'object' && selectedSlot !== null && 'start' in selectedSlot ? selectedSlot.start : '';
    console.log("[handle-slot-choice] selectedSlot:", callMemoryStore[CallSid].slot);
    return c.text(`<Response><Gather numDigits="1" action="${c.env.BASE_URL}/api/v1/user/confirm-appointment" method="POST"><Say>You have selected the appointment slot at ${callMemoryStore[CallSid].slot}. Press 1 to confirm or 2 to cancel.</Say></Gather></Response>`);
});

userRouter.post("/confirm-appointment", async (c) => {  
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const formData5 = await c.req.parseBody() as Record<string, string | File>;
    const Digits = typeof formData5["Digits"] === "string" ? formData5["Digits"] : "";
    const CallSid = typeof formData5["CallSid"] === "string" ? formData5["CallSid"] : "";
    console.log("[confirm-appointment] CallSid:", CallSid, "Digits:", Digits);

    if (Digits === "1") {
        // Confirm appointment
        const { userId, doctorId, date, slot } = callMemoryStore[CallSid] || {};
        console.log("[confirm-appointment] Creating appointment with:", { userId, doctorId, date, slot });
        if (!userId || !doctorId || !date || !slot) {
            return c.text(`<Response><Say>Session expired or invalid. Please start again.</Say><Hangup/></Response>`);
        }
        try {
            // Get user and doctor details for email
            const [user, doctor] = await Promise.all([
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.doctor.findUnique({ where: { id: doctorId } })
            ]);

            if (!user || !doctor) {
                return c.text(`<Response><Say>Error: User or doctor not found. Please try again later.</Say><Hangup/></Response>`);
            }

            const appointment = await prisma.appointment.create({
                data: {
                    userId,
                    doctorId,
                    slot,
                    date: new Date(date),
                    status: "PENDING"
                }
            });

            const sendEmail = async (to: string, subject: string, html: string, retries = 3) => {
                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
                            personalizations: [{ to: [{ email: to }] }],
                            from: { email: 'equihealthh@gmail.com', name: 'EquiHealth' },
                            subject: subject,
                            content: [{ type: 'text/html', value: html }]
                        }, {
                            headers: {
                                'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
                                'Content-Type': 'application/json',
                            },
                            timeout: 10000 // 10 second timeout
                        });

                        if (response.status === 202) {
                            console.log(`Email sent successfully to ${to}`);
                            return true;
                        }
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.message || error.message;
                        console.error(`Attempt ${attempt}/${retries} failed to send email to ${to}:`, errorMessage);
                        
                        if (attempt === retries) {
                            console.error(`Failed to send email after ${retries} attempts to ${to}`);
                            return false;
                        }

                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    }
                }
                return false;
            };

            const emailPromises = [
                sendEmail(
                    user.email,
                    'Appointment Confirmed via Phone Call',
                    `<p>Hi ${user.name},</p>
                    <p>Your appointment with Dr. ${doctor.name} on <strong>${new Date(date).toLocaleDateString()}</strong> at <strong>${slot}</strong> has been booked successfully through our phone booking system.</p>
                    <p>Status: <strong>PENDING</strong></p>
                    <p>We'll notify you once the doctor updates the appointment status.</p>
                    <p>- EquiHealth Team</p>`
                ),
                sendEmail(
                    doctor.email,
                    'New Phone Appointment Booked',
                    `<p>Hi Dr. ${doctor.name},</p>
                    <p>A new appointment has been booked through our phone booking system for <strong>${new Date(date).toLocaleDateString()}</strong> at <strong>${slot}</strong> by ${user.name}.</p>
                    <p>Please visit your dashboard to update the appointment status.</p>
                    <p>- EquiHealth System</p>`
                )
            ];

            // Wait for all email attempts to complete
            const emailResults = await Promise.allSettled(emailPromises);
            
            // Log email sending results
            emailResults.forEach((result, index) => {
                const recipient = index === 0 ? user.email : doctor.email;
                if (result.status === 'fulfilled') {
                    console.log(`Email to ${recipient} ${result.value ? 'sent successfully' : 'failed after retries'}`);
                } else {
                    console.error(`Email to ${recipient} failed with error:`, result.reason);
                }
            });

            // Optionally, clean up memory
            delete callMemoryStore[CallSid];
            console.log("[confirm-appointment] Appointment created:", appointment);
            return c.text(`<Response><Say>Your appointment has been confirmed. You will receive a confirmation email shortly. Thank you for using EquiHealth.</Say><Hangup/></Response>`);
        } catch (error: any) {
            console.error("[confirm-appointment] Error confirming appointment:", error);
            return c.text(`<Response><Say>An error occurred while confirming your appointment. Please try again later.</Say><Hangup/></Response>`);
        }
    } else {
        // Cancel
        delete callMemoryStore[CallSid];
        console.log("[confirm-appointment] Appointment cancelled for CallSid:", CallSid);
        return c.text(`<Response><Say>Appointment booking cancelled. Thank you for using EquiHealth.</Say><Hangup/></Response>`);
    }
});

// Move the authentication middleware below the IVR routes
userRouter.use("/*", async (c, next) => {
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
            c.set('userId', String(decode.id));
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

userRouter.get("/profile", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const userId = c.get("userId");

    try {

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            c.status(404);
            return c.json({ message: "User not found" });
        }

        c.status(200);
        return c.json({
            message: "User profile found successfully",
            user:{
                email: user.email,
                name: user.name,
                age: user.age,
                height: user.height,
                weight: user.weight,
                gender: user.gender,
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt)
            }
        });
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});

userRouter.put("/update", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    // @ts-ignore
    const userId = c.get("userId");
    const body = await c.req.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
        c.status(400);
        return c.json({ message: "Invalid data" });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: body,
        });
        c.status(200);
        return c.json({
            message: "User profile updated successfully",
            user: {
                email: updatedUser.email,
                name: updatedUser.name,
                age: updatedUser.age,
                height: updatedUser.height,
                weight: updatedUser.weight,
            }
        })
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
})


userRouter.post("/getDoctorsBySpecialization", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const correctSpecializationBody = specializationSchema.safeParse(body);
    
    if (!correctSpecializationBody.success) {
        const errorMessage = correctSpecializationBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({ message: errorMessage });
    }

    try {
        const doctors = await prisma.doctor.findMany({
            where: { 
                specialization: correctSpecializationBody.data.specialization 
            },
            select: { 
                id: true, 
                name: true ,
                specialization: true
            }
        });
        if (!doctors || doctors.length === 0) {
            c.status(404);
            return c.json({ message: "No doctors found for the given specialization" });
        }

        c.status(200);
        return c.json({ 
            doctors: doctors.map((doctor) => ({
                id: doctor.id,
                name: doctor.name,
                specialization: doctor.specialization
            })) 
        });
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});

userRouter.get("/getDoctorSlots", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    
    const doctorId = c.req.query("doctorId");
    const date = c.req.query("date");
    const userId = c.get("userId");
    if (!doctorId || !date) {
        c.status(400);
        return c.json({ message: "doctorId and date are required" });
    }
    
    try {
        const doctorAvailability = await prisma.doctorAvailability.findFirst({
            where: { 
                doctorId, 
                date: new Date(date)
            }
        });
        
        if (!doctorAvailability) {
            c.status(404);
            return c.json({ 
                message: "No available slots for this doctor on the given date" 
            });
        }

        // Fetch slots already booked by this user for this doctor and date
        const userAppointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                userId,
                date: new Date(date)
            },
            select: { slot: true }
        });
        const userBookedSlots = userAppointments.map(a => a.slot);

        // Filter out slots already booked by this user
        let filteredSlots: any[] = [];
        if (Array.isArray(doctorAvailability.slots)) {
            filteredSlots = doctorAvailability.slots.filter((slot: any) =>
                !userBookedSlots.includes(typeof slot === 'string' ? slot : slot.start)
            );
        }
        c.status(200);
        return c.json({ slots: filteredSlots });
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});

userRouter.post("/bookAppointment", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const userId = c.get("userId");
    console.log("User ID:", userId);
    const body = await c.req.json();
    const correctAppointmentBody = appointmentSchema.safeParse(body);

    if (!correctAppointmentBody.success) {
        const errorMessage = correctAppointmentBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({ message: errorMessage });
    }

    try {
        // Get user and doctor details for email
        const [user, doctor] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.doctor.findUnique({ where: { id: correctAppointmentBody.data.doctorId } })
        ]);

        if (!user || !doctor) {
            c.status(404);
            return c.json({ message: "User or doctor not found" });
        }

        const doctorAvailability = await prisma.doctorAvailability.findFirst({
            where: { 
                doctorId: correctAppointmentBody.data.doctorId, 
                date: new Date(correctAppointmentBody.data.date) }
        });

        console.log("Doctor Availability:", doctorAvailability);
        console.log("User Input Slot:", body.slot);

        if (!doctorAvailability || !Array.isArray(doctorAvailability.slots)) {
            c.status(400);
            return c.json({ 
                message: "No available slots for this doctor on the selected date" 
            });
        }

        const selectedSlot = correctAppointmentBody.data.slot.replace(/\s?(AM|PM)/, "");
        console.log("Selected Slot:", selectedSlot);  

        const slotExists = doctorAvailability.slots.some(slot => 
            typeof slot === 'object' && slot !== null && 'start' in slot && slot.start === selectedSlot
        );

        if (!slotExists) {
            c.status(400);
            return c.json({ message: "Selected slot is not available" });
        }

        // Remove the booked slot from doctorAvailability.slots
        const updatedSlots = doctorAvailability.slots.filter(slot => {
            if (typeof slot === 'object' && slot !== null && 'start' in slot) {
                return slot.start !== selectedSlot;
            }
            return true;
        });
        await prisma.doctorAvailability.update({
            where: { doctorId_date: { doctorId: correctAppointmentBody.data.doctorId, date: new Date(correctAppointmentBody.data.date) } },
            data: { slots: updatedSlots }
        });

        const appointment = await prisma.appointment.create({
            data: {
                userId,
                doctorId: correctAppointmentBody.data.doctorId,
                slot: selectedSlot,
                date: new Date(correctAppointmentBody.data.date),
                status: "PENDING",
                meetingId: null
            }
        });

        const sendEmail = async (to: string, subject: string, html: string, retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
                        personalizations: [{ to: [{ email: to }] }],
                        from: { email: 'equihealthh@gmail.com', name: 'EquiHealth' },
                        subject: subject,
                        content: [{ type: 'text/html', value: html }]
                    }, {
                        headers: {
                            'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 10000 // 10 second timeout
                    });

                    if (response.status === 202) {
                        console.log(`Email sent successfully to ${to}`);
                        return true;
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message;
                    console.error(`Attempt ${attempt}/${retries} failed to send email to ${to}:`, errorMessage);
                    
                    if (attempt === retries) {
                        console.error(`Failed to send email after ${retries} attempts to ${to}`);
                        return false;
                    }

                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
            return false;
        };

        const emailPromises = [
            sendEmail(
                user.email,
                'Appointment Confirmed',
                `<p>Hi ${user.name},</p>
                <p>Your appointment with Dr. ${doctor.name} on <strong>${correctAppointmentBody.data.date}</strong> at <strong>${selectedSlot}</strong> has been booked successfully.</p>
                <p>Status: <strong>PENDING</strong></p>
                <p>We'll notify you once the doctor updates the appointment status.</p>
                <p>- EquiHealth Team</p>`
            ),
            sendEmail(
                doctor.email,
                'New Appointment Booked',
                `<p>Hi Dr. ${doctor.name},</p>
                <p>A new appointment has been booked for <strong>${correctAppointmentBody.data.date}</strong> at <strong>${selectedSlot}</strong> by ${user.name}.</p>
                <p>Please visit your dashboard to update the appointment status.</p>
                <p>- EquiHealth System</p>`
            )
        ];

        // Wait for all email attempts to complete
        const emailResults = await Promise.allSettled(emailPromises);
        
        // Log email sending results
        emailResults.forEach((result, index) => {
            const recipient = index === 0 ? user.email : doctor.email;
            if (result.status === 'fulfilled') {
                console.log(`Email to ${recipient} ${result.value ? 'sent successfully' : 'failed after retries'}`);
            } else {
                console.error(`Email to ${recipient} failed with error:`, result.reason);
            }
        });

        c.status(200);
        return c.json({ 
            message: "Appointment booked successfully", 
            appointment,
            emailStatus: {
                userEmailSent: emailResults[0].status === 'fulfilled' && emailResults[0].value,
                doctorEmailSent: emailResults[1].status === 'fulfilled' && emailResults[1].value
            }
        });

    } catch (e: any) {
        console.error('Appointment booking error:', e);
        c.status(500);
        return c.json({ 
            message: "Internal Server Error"
        });
    }
});

userRouter.get("/getAppointments", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    
    const userId = c.get("userId");
    
    try {
        const appointments = await prisma.appointment.findMany({
            where: { userId },
            include: {
                doctor: {
                    select: { name: true, specialization: true }
                }
            }
        });
        
        c.status(200);
        return c.json({ 
            appointments: appointments.map((appointment) => ({
                id: appointment.id,
                doctorName: appointment.doctor.name,
                specialization: appointment.doctor.specialization,
                slot: appointment.slot,
                date: formatDate(appointment.date),
                status: appointment.status
            })) 
        });
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
});

userRouter.post("/predictDisease", async (c) => {
  const body = await c.req.json();
  const validation = predictionSchema.safeParse(body);

  if (!validation.success) {
    const errors = validation.error.errors.map(e => e.message);
    c.status(400);
    return c.json({ message: errors });
  }
  
  try {
    console.log("Sending request to Flask service at:", c.env.FLASK_SERVICE);
    const response = await axios.post(
      c.env.FLASK_SERVICE,
      {
        symptoms: body.symptoms
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const { predicted_diseases, related_departments } = response.data;

    return c.json({
      message: "Prediction successful",
      prediction: predicted_diseases,
      departments: related_departments
    });
  } catch (error: any) {
    console.error("Prediction Error:", error.message || error);
    c.status(500);
    return c.json({
      message: "Error during prediction",
      error: error.response?.data || error.message
    });
  }
});

userRouter.post("/chat-support", async (c) => {
    const openai = new OpenAI({
        apiKey: c.env.OPENROUTER_API_KEY,
        baseURL: c.env.OPENROUTER_BASE_URL
    });
    const body = await c.req.json();

    // Expecting: { messages: [{role: 'system'|'user'|'assistant', content: string}, ...] }
    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
        c.status(400);
        return c.json({ message: "Invalid messages array" });
    }

    try {
        const response = await openai.chat.completions.create({
            model: "google/gemma-3-27b-it:free",
            messages: messages,
        });

        const reply = response.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";
        c.status(200);
        return c.json({
            reply
        });
    } catch (error: any) {
        console.error("Error:", error);
        c.status(500);
        return c.json({
            message: "Error while getting AI response",
            error: error.message
        });
    }
});

userRouter.get("/food-info", async(c) => {
    const { foodName, barcode } = c.req.query();
    console.log("Food Name:", foodName);
    console.log("Barcode:", barcode);
    if (!foodName && !barcode) {
        c.status(400);
        return c.json({ message: "Provide either foodName or barcode" });
    }

    try {
        const foodInfo = await getFoodInfo(foodName, barcode);
        c.status(200);
        return c.json({
            message: "Food information retrieved successfully",
            foodInfo
        });
    } catch (err: any) {
        console.error("Error fetching food info:", err);
        c.status(500);
        return c.json({
            message: "Error while fetching food information",
            error: err.message || "Internal Server Error"
        });
    }
})

userRouter.get("/health-score", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    
    const userId = c.get("userId");
    if (!userId) {
        c.status(401);
        return c.json({ message: "Unauthorized: User ID not found" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { age: true, height: true, weight: true },
        });

        if (!user) {
            c.status(404);
            return c.json({ message: "User not found" });
        }

        const { foodName, barcode } = c.req.query();
        const healthScore = await calculateHealthScore(user, foodName, barcode);

        c.status(200);
        return c.json({
            message: "Health score computed successfully",
            ...healthScore
        });
    } catch (err: any) {
        console.error("Error computing health score:", err);
        c.status(500);
        return c.json({
            message: "Error while computing health score",
            error: err.message || "Internal Server Error",
        });
    }
});

userRouter.post("/dietary-check", async (c) => {
    const { foodName, barcode } = c.req.query();
    const body = await c.req.json();
    const { dietType } = body;

    if (!dietType) {
        c.status(400);
        return c.json({
            message: "dietType is required in request body (e.g., vegan, gluten-free)"
        });
    }

    try {
        const dietaryCheck = await checkDietaryCompatibility(foodName, barcode, dietType);
        
        c.status(200);
        return c.json({
            message: "Dietary compatibility check complete",
            ...dietaryCheck
        });
    } catch (err: any) {
        c.status(500);
        return c.json({
            message: "Error during dietary check",
            error: err.message || "Internal Server Error",
        });
    }
});

// Fetch user or doctor info by ID for community forum
userRouter.get("/info/:id", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const { id } = c.req.param();
    // Try to find user
    let user = await prisma.user.findUnique({
        where: { id: id },
        select: { id: true, name: true, role: true }
    });
    if (user) {
        c.status(200);
        return c.json(user);
    }
    // Try to find doctor
    let doctor = await prisma.doctor.findUnique({
        where: { id: id },
        select: { id: true, name: true, role: true, specialization: true }
    });
    if (doctor) {
        c.status(200);
        return c.json(doctor);
    }
    c.status(404);
    return c.json({ message: "User or doctor not found" });
});

  