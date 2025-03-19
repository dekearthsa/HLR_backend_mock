"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify = (0, fastify_1.default)({
    logger: true
});
const PORT = 3311;
fastify.get('/', (request, reply) => {
    reply.send({ hello: 'world' });
});
fastify.listen({ port: PORT }, (err, address) => {
    if (err)
        throw err;
    console.log(`fastify listen port ${PORT}`);
});
