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
// interface UserParamsRange {
//     atYear: Number
//     atMonth: Number
//     atDay: Number
//     endYear: Number
//     endMonth: Number
//     endDay: Number
// }
const pool = promise_1.default.createPool({
    // socketPath: '/var/run/mysqld/mysqld.sock',
    host: '127.0.0.1',
    password: '',
    // port: 3306,
    database: 'monitoring_tongdy',
    user: 'root',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
fastify.get("/debug", (request, reply) => {
    reply.send(`service running status ok!`);
});
fastify.get('/api/download/selected/:year/:month/:day', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year, month, day } = request.params;
        const [data] = yield pool.query(`SELECT *
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
fastify.get('/api/selected/:year/:month/:day', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, month, day } = request.params;
    const [data] = yield pool.query(`SELECT *
            FROM tongdy 
            WHERE YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            AND DAY(timestamp) = ?`, [year, month, day]);
    reply.send(data);
}));
// fastify.get<{ Params: UserParamsRange }>('/api/downlod/range/:atYear/:atMonth/:atDay/:endYear/:endMonth/:endDay', (request, reply) => {
//     const { atYear, atMonth, atDay, endYear, endMonth, endDay } = request.params;
//     reply.send({ hello: `hello world` })
// }) 2jVWUXojlziLE7H0q0cZo9xFOZg_6Z8mie7CiRxsAUARrNAnb
fastify.listen({ port: PORT }, (err, address) => {
    if (err)
        throw err;
    console.log(`fastify listen port ${PORT}`);
});
