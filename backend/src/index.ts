import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRouter } from './routes/user'
import { adminRouter } from './routes/admin'
import { doctorRouter } from './routes/doctor'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>()  

app.use("/*", cors());

app.route("/api/v1/user", userRouter);
app.route("api/v1/admin", adminRouter);
app.route("api/v1/doctor", doctorRouter);

export default app
