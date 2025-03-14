import { Hono } from "hono";
import z from "zod";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify, decode } from "hono/jwt";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
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

const signUpSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    age: z.number().int(),
    height: z.number().int(),
    weight: z.number().int(),
    gender: z.enum(["male", "female", "other"]),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

const signInSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

const updateSchema = z.object({
    name: z.string().optional(),
    age: z.number().int().optional(),
    height: z.number().int().optional(),
    weight: z.number().int().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
});

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
                token: token
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
            token: token
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
            // @ts-ignore
            c.set('userId', String(decode.id));
            // @ts-ignore
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

    // @ts-ignore
    const userId = c.get("userId");

    try {
        // @ts-ignore
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
            // @ts-ignore
            where: { id: userId },
            data: body,
        });
        c.status(200);
        return c.json({ message: "User updated successfully"});
    } catch (e) {
        console.error(e);
        c.status(500);
        return c.json({ message: "Internal Server Error" });
    }
})