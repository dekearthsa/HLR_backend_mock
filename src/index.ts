import Fastify from 'fastify'
import mysql from 'mysql2/promise' // ✅ Use `mysql2/promise`

const fastify = Fastify({
    logger: false
})

const PORT = 3311

interface UserParams {
    year: number;
    month: number;
    day: number;
}

// interface UserParamsRange {
//     atYear: Number
//     atMonth: Number
//     atDay: Number
//     endYear: Number
//     endMonth: Number
//     endDay: Number
// }

const pool = mysql.createPool({
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
    reply.send(`service running status ok!`)
})

fastify.get<{ Params: UserParams }>('/api/download/selected/:year/:month/:day', async (request, reply) => {
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

// fastify.get<{ Params: UserParamsRange }>('/api/downlod/range/:atYear/:atMonth/:atDay/:endYear/:endMonth/:endDay', (request, reply) => {
//     const { atYear, atMonth, atDay, endYear, endMonth, endDay } = request.params;
//     reply.send({ hello: `hello world` })
// }) 2jVWUXojlziLE7H0q0cZo9xFOZg_6Z8mie7CiRxsAUARrNAnb

fastify.listen({ port: PORT }, (err, address) => {
    if (err) throw err
    console.log(`fastify listen port ${PORT}`)
})