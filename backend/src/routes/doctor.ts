import { Hono } from "hono";
import z from "zod";
import { PrismaClient } from "@prisma/client/edge";
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

