"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const promise_1 = __importDefault(require("mysql2/promise"));
const json2csv_1 = require("json2csv");
const fastify = (0, fastify_1.default)({
    logger: false
});
const PORT = 3311;
const paramsSchema = {
    type: 'object',
    properties: {
        year: { type: "integer", minimum: 2000, maximum: 2100 },
        month: { type: "integer", minimum: 1, maximum: 12 },
        day: { type: "integer", minimum: 1, maximum: 31 }
    },
    required: ["year", "month", "day"]
};
const resGetAPISchema = {
    200: {
        type: "array",
        item: {
            type: "object",
            properties: {
                id: { type: "integer" },
                timestamp: { type: "string", format: "date-time" },
                temp: { type: "number" },
                co2: { type: "integer" },
                device_name: { type: "string" },
                humidity: { type: "number" },
            },
            require: ["id", "temp", "humidity", "co2", "device_name", "timestamp"]
        }
    },
    404: {
        type: "object",
        properties: {
            error: { type: "string" }
        }
    }
};
const pool = promise_1.default.createPool({
    host: '127.0.0.1',
    password: '',
    database: 'monitoring_tongdy',
    user: 'root',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
fastify.get("/debug", (request, reply) => {
    reply.send(`service running status ok!`);
});
// fastify.get<{ Params: UserParams }>('/api/download/selected/:year/:month/:day', { schema: { params: paramsSchema } }, async (request, reply) => {
//     try {
//         const { year, month, day } = request.params;
//         const [data] = await pool.query(
//             `SELECT *
//             FROM tongdy 
//             WHERE YEAR(timestamp) = ? 
//             AND MONTH(timestamp) = ? 
//             AND DAY(timestamp) = ?`, [year, month, day]
//         );
//         if (Array.isArray(data) && data.length > 0) {
//             const json2csvParser = new Parser();
//             const csv = json2csvParser.parse(data);
//             reply.header('Content-Type', 'text/csv');
//             reply.header('Content-Disposition', `attachment; filename="data_${year}-${month}-${day}.csv"`);
//             return reply.send(csv);
//         } else {
//             return reply.code(404).send({ error: "No data found for the selected date" });
//         }
//     } catch (err) {
//         reply.send("error /api/download/selected " + err)
//     }
// })
fastify.get('/api/download/selected/:year/:month/:day', { schema: { params: paramsSchema } }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year, month, day } = request.params;
        const [data] = yield pool.query(`SELECT *,
            CASE
                WHEN device_name = 'tongdy_1' THEN (co2 * 0.922144) + 220.8915
                WHEN device_name = 'tongdy_2' THEN (co2 * 1.11773) - 97.9053
                WHEN device_name = 'tongdy_3' THEN (co2 * 1.070889) - 2.3568
                WHEN device_name = 'tongdy_4' THEN (co2 * 1.123171) - 57.9253
                ELSE co2
            END AS adjust_co2
            FROM tongdy 
            WHERE YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            AND DAY(timestamp) = ?`, [year, month, day]);
        if (Array.isArray(data) && data.length > 0) {
            const json2csvParser = new json2csv_1.Parser();
            const csv = json2csvParser.parse(data);
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="data_${year}-${month}-${day}.csv"`);
            return reply.send(csv);
        }
        else {
            return reply.code(404).send({ error: "No data found for the selected date" });
        }
    }
    catch (err) {
        reply.send("error /api/download/selected " + err);
    }
}));
fastify.get('/api/selected/:year/:month/:day', { schema: { params: paramsSchema, response: resGetAPISchema } }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, month, day } = request.params;
    const [data] = yield pool.query(`SELECT *
            FROM tongdy 
            WHERE YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            AND DAY(timestamp) = ?`, [year, month, day]);
    reply.send(data);
}));
fastify.listen({ port: PORT }, (err, address) => {
    if (err)
        throw err;
    console.log(`fastify listen port ${PORT}`);
});
