import Fastify from 'fastify'
import mysql from 'mysql2/promise'
import { Parser } from 'json2csv'

const fastify = Fastify({
    logger: false
})

const PORT = 3311

interface UserParams {
    year: number;
    month: number;
    day: number;
}

const paramsSchema = {
    type: 'object',
    properties: {
        year: { type: "integer", minimum: 2000, maximum: 2100 },
        month: { type: "integer", minimum: 1, maximum: 12 },
        day: { type: "integer", minimum: 1, maximum: 31 }
    },
    required: ["year", "month", "day"]
}

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
}

const pool = mysql.createPool({
    host: '127.0.0.1',
    password: '',
    database: 'monitoring_tongdy',
    user: 'root',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



fastify.get("/debug", (request, reply) => {
    reply.send(`service running status ok!`)
})

fastify.get<{ Params: UserParams }>('/api/download/selected/:year/:month/:day', { schema: { params: paramsSchema } }, async (request, reply) => {
    try {
        const { year, month, day } = request.params;
        const [data] = await pool.query(
            `SELECT *
            FROM tongdy 
            WHERE YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            AND DAY(timestamp) = ?`, [year, month, day]
        );
        if (Array.isArray(data) && data.length > 0) {
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(data);

            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="data_${year}-${month}-${day}.csv"`);

            return reply.send(csv);
        } else {
            return reply.code(404).send({ error: "No data found for the selected date" });
        }
    } catch (err) {
        reply.send("error /api/download/selected " + err)
    }

})

fastify.get<{ Params: UserParams }>('/api/selected/:year/:month/:day', { schema: { params: paramsSchema, response: resGetAPISchema } }, async (request, reply) => {
    const { year, month, day } = request.params;
    const [data] = await pool.query(
        `SELECT *
            FROM tongdy 
            WHERE YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            AND DAY(timestamp) = ?`, [year, month, day]
    );

    reply.send(data);
})


fastify.listen({ port: PORT }, (err, address) => {
    if (err) throw err
    console.log(`fastify listen port ${PORT}`)
})