import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from "zod";
import { sign, verify } from "hono/jwt";

export const adminRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }, Variables: {
        adminId: string
        role: string
    }
}>();

const signUpSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

const signInSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

adminRouter.post("/signup", async(c) => {
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

    try {
        const adminExists = await prisma.admin.findUnique({
            where: {
                email: body.email
            }
        })

        if (adminExists) {
            c.status(400);
            return c.json({
                message: "Email already in use"
            })
        } else {
            const admin = await prisma.admin.create({
                data: {
                    email: body.email,
                    name: body.name,
                    password: body.password
                }
            })

            const token = await sign({
                id: admin.id
            }, c.env.JWT_SECRET);

            c.status(200);
            return c.json({
                message: "Sign up successful",
                token: token
            })
        }
    } catch (e) {
        c.status(500);
        return c.json({
            message: "Internal server error"
        })
    }
})

adminRouter.post("/signin", async(c) => {
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
        const admin = await prisma.admin.findUnique({
            where: {
                email: body.email,
                password: body.password
            }
        });

        if (!admin) {
            c.status(400);
            return c.json({
                message: "Invalid email or password"
            })
        }

        const token = await sign({
            id: admin.id,
            role: admin.role
        }, c.env.JWT_SECRET);

        c.status(200);
        return c.json({
            message: "Sign in successful",
            token: token
        })
    } catch (e) {
        c.status(500);
        return c.json({
            message: "Error while signing in. Internal server error"
        })
    }
})

adminRouter.use("/*", async(c, next) => {
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
            c.set('adminId', String(decode.id));
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

adminRouter.get("/profile", async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const adminId = c.get("adminId");

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                id: adminId
            }
        })   
    
        if (!admin) {
            c.status(404);
            return c.json({ message: "Admin not found. Please login first" });
        }
    
        c.status(200);
        const userCount = await prisma.user.count();
        const doctorCount = await prisma.doctor.count();
        return c.json({
            message: "Welcome to the Admin Dashboard",
            admin: {
                email: admin.email,
                name: admin.name,
                totalUsers: userCount,
                totalDoctors: doctorCount
            }
        });
    } catch (e) {
        c.status(500); 
        return c.json({
            message: "Internal Server Error"
        })
    }
})

adminRouter.get("/users", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const users = await prisma.user.findMany();
        c.status(200);
        return c.json({ users });
    } catch (e) {
        c.status(500);
        return c.json({ message: "Internal server error" });
    }
});


adminRouter.get("/doctors", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const doctors = await prisma.doctor.findMany();
        c.status(200);
        return c.json({ doctors });
    } catch (e) {
        c.status(500);
        return c.json({ message: "Internal server error" });
    }
});
