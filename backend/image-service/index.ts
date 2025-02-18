import { Elysia } from "elysia";
import { imageController } from "./src/controllers/imageController";

const app = new Elysia()
    .use(imageController)
    .listen(3003);

console.log(
    `🖼️ Image Service is running at ${app.server?.hostname}:${app.server?.port}`
);