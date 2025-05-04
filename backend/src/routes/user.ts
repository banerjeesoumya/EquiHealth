import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify, decode } from "hono/jwt";
import axios from "axios";
import OpenAI from "openai";
import { appointmentSchema, chatSupportSchema, formatDate, predictionSchema, signInSchema, signUpSchema, specializationSchema, updateSchema } from "../utils/userType";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
        FLASK_SERVICE: string
        OPENROUTER_API_KEY: string
        OPENROUTER_BASE_URL: string
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


userRouter.get("/getDoctorsBySpecialization", async (c) => {
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
                name: true 
            }
        });
        
        c.status(200);
        return c.json({ 
            doctors: doctors.map((doctor) => ({
                id: doctor.id,
                name: doctor.name
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
    console.log(doctorId)
    console.log(date)
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
        
        c.status(200);
        return c.json({ 
            slots: doctorAvailability.slots 
        });
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
    const body = await c.req.json();
    const correctAppointmentBody = appointmentSchema.safeParse(body);

    if (!correctAppointmentBody.success) {
        const errorMessage = correctAppointmentBody.error.errors.map((error) => error.message);
        c.status(400);
        return c.json({ message: errorMessage });
    }

    try {
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

        const slotExists = doctorAvailability.slots.some(slot => 
            typeof slot === 'object' && slot !== null && 'start' in slot && slot.start === selectedSlot
        );

        if (!slotExists) {
            c.status(400);
            return c.json({ message: "Selected slot is not available" });
        }

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

        c.status(200);
        return c.json({ message: "Appointment booked successfully", appointment });

    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
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
      const response = await axios.post(
        c.env.FLASK_SERVICE,
        {
          symptoms: body.symptoms
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      console.log(response);
      const prediction = response.data.predicted_diseases;
  
      return c.json({
        message: "Prediction successful",
        prediction
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
    })
    const body = await c.req.json();
    console.log(body)
    const validation = chatSupportSchema.safeParse(body);
     if (!validation.success) {
        const errors = validation.error.errors.map(e => e.message);
        c.status(400);
        return c.json({ 
            message: errors 
        });
    }
    try {
        const reply = await getReply(body.message);
        c.status(200);
        return c.json({
            message: "AI response received",
            reply: reply
        })
    } catch (error : any) {
        console.error("Error:", error);
        c.status(500);
        return c.json({
            message: "Error while getting AI response",
            error: error.message
        })
    }
    async function getReply(message: string) {
        try {
            const response = await openai.chat.completions.create({
                model: "google/gemini-2.0-flash-thinking-exp:free",
                messages: [
                    {
                        role: "system",
                        content: `You are an AI-powered healthcare assistant for the platform "Equihealth". Your role is to assist users with general health-related queries in a friendly and informative manner.
    
                        Guidelines to follow:
                        - Begin by greeting the user and briefly introducing Equihealth.
                        - Mention core features available to users:
                        • Symptom-based disease prediction tool
                        • Appointment booking system with certified doctors
                        • Chat support for general health queries
                        • Access to AI-generated health tips
                        - Never diagnose diseases directly.
                        - If the user describes symptoms, suggest using the Disease Prediction feature for better assessment.
                        - Always recommend consulting a doctor when the issue seems serious or uncertain.
                        - Keep your responses concise, clear, and user-friendly.
                        - Use a tone that is empathetic and respectful to all users.`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            });
            return response.choices[0].message.content;
        } catch (err) {
            console.error("Error:", err);
            throw new Error("AI Service Failed");
        }
    }
})  
  
  