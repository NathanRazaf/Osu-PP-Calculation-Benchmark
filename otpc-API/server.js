const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
const axios = require('axios');
const { getAccessToken } = require('./token');
const { calculatePerformance } = require('./services/mainCalculator');

dotenv.config();

async function getScoreDetails(scoreId) {
    try {
        const token = await getAccessToken();
        const response = await axios.get(`https://osu.ppy.sh/api/v2/scores/${scoreId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-api-version": 20220705
            }
        })
        const data = response.data;
        const beatmapId = data.beatmap_id;
        const mods = data.mods.map((mod) => mod.acronym);
        const accPercent = data.accuracy * 100;
        const combo = data.max_combo;
        const nmiss = data.statistics.miss || 0;
        const largeTickMiss = data.statistics.large_tick_miss || 0;
        const sliderTailMiss = (data.maximum_statistics.slider_tail_hit - data.statistics.slider_tail_hit) || 0;
        const scoreParams = { beatmapId, mods, accPercent, combo, nmiss, sliderTailMiss, largeTickMiss };
        return scoreParams;
    } catch (error) {
        throw error;
    }
}

// API endpoint for PP calculation
fastify.post('/calculate', async (request, reply) => {
    try {
        let scoreParams;
        
        if (request.body.scoreId) {
            // If scoreId is provided, fetch score details
            try {
                scoreParams = await getScoreDetails(request.body.scoreId);
            } catch (error) {
                reply.status(400).send({ error: `Failed to fetch score details: ${error.message}` });
                return;
            }
        } else {
            // Use parameters directly from request body
            scoreParams = {
                beatmapId: request.body.beatmapId,
                mods: request.body.mods,
                accPercent: request.body.accPercent,
                n50: request.body.n50,
                n100: request.body.n100,
                combo: request.body.combo,
                nmiss: request.body.nmiss,
                sliderTailMiss: request.body.sliderTailMiss || 0,
                largeTickMiss: request.body.largeTickMiss || 0
            };
        }

        try {
            const result = await calculatePerformance(scoreParams, __dirname);
            reply.send(result);
        } catch (error) {
            reply.status(500).send({ error: error.message });
        }
    } catch (error) {
        reply.status(500).send({ error: `Unexpected error: ${error.message}` });
    }
});

// Get approximate rank for PP value
fastify.get('/rank-from-pp', async (request, reply) => {
    const pp = request.query.pp;
    const mode = request.query.mode || '0';

    if (!pp) {
        reply.status(400).send({ error: 'PP value is required' });
        return;
    }

    try {
        const response = await axios.get('https://osudaily.net/data/getPPRank.php', {
            params: {
                't': 'pp',
                'v': pp.toString(),
                'm': mode.toString()
            }
        });
        if (response.status === 200) {
            reply.send({ rank: response.data });
        } else {
            reply.status(response.status).send({ error: `OSU Daily API error: ${response.status}` });
        }
    } catch (error) {
        reply.status(500).send({ error: `Failed to fetch rank: ${error.message}` });
    }
});

// Get PP required for rank
fastify.get('/pp-for-rank', async (request, reply) => {
    const rank = request.query.rank;
    const mode = request.query.mode || '0';

    if (!rank) {
        reply.status(400).send({ error: 'Rank is required' });
        return;
    }

    try {
        const response = await axios.get('https://osudaily.net/data/getPPRank.php', {
            params: {
                't': 'rank',
                'v': rank.toString(),
                'm': mode.toString()
            }
        });

        if (response.status === 200) {
            reply.send({ pp: response.data });
        } else {
            reply.status(response.status).send({ error: `OSU Daily API error: ${response.status}` });
        }
    } catch (error) {
        reply.status(500).send({ error: `Failed to fetch PP: ${error.message}` });
    }
});

// Start the server
fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
    if (err) throw err;
    fastify.log.info(`Performance Calculator API running at ${address}`);
});