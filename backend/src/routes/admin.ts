import { Hono } from "hono";

export const adminRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
}>();

adminRouter.post("/signup", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the admin signup route"
    })
})

adminRouter.post("/signin", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the admin signin route"
    })
})

adminRouter.get("/profile", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the admin profile route"
    })
})