import { Hono } from "hono";

export const doctorRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string
        JWT_SECRET: string
    }
}>();

doctorRouter.post("/signup", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the doctor signup route"
    })
})

doctorRouter.post("/signin", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the doctor signin route"
    })
})

doctorRouter.get("/profile", async(c) => {
    c.status(200);
    return c.json({
        message: "Hello from the doctor profile route"
    })
})