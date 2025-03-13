import { Hono } from "hono";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
}>();

userRouter.post("/signup", async (c) => {
    c.status(200);
    return c.json({
        message: "Hello from the user signup route"
    })  
})

userRouter.post("/signin", async (c) => {
    c.status(200);
    return c.json({
        message: "Hello from the user signin route"
    })
})

userRouter.get("/profile", async (c) => {
    c.status(200);
    return c.json({
        message: "Hello from the user profile route"
    })
})