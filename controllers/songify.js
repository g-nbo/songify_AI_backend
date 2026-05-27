const OpenAI = require('openai');
const User = require('../models/User');
const openai = new OpenAI();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

module.exports = {
    getSong,
    getTrack,
    createFavorite,
    readFavorites,
    deleteFavorite,
};

async function getSpotifyToken() {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    });
    const data = await res.json();
    return data.access_token;
}

async function getTrack(req, res) {
    try {
        console.log(`[getTrack] fetching track ${req.params.id}`);
        const token = await getSpotifyToken();
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!trackRes.ok) {
            console.warn(`[getTrack] spotify returned ${trackRes.status} for track ${req.params.id}`);
            return res.status(trackRes.status).json({ message: 'Track not found' });
        }

        const track = await trackRes.json();
        res.status(200).json({
            id: track.id,
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url ?? null,
            spotifyUrl: track.external_urls.spotify,
        });
    } catch (err) {
        console.error(`[getTrack] error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
}

async function createFavorite(req, res) {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            console.warn(`[createFavorite] user not found for id ${req.userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.favorites.includes(req.body.songId)) {
            console.log(`[createFavorite] duplicate ignored — user ${req.userId} already has song ${req.body.songId}`);
            return res.status(200).json(user.favorites);
        }

        user.favorites.push(req.body.songId);
        await user.save();
        console.log(`[createFavorite] user ${req.userId} added song ${req.body.songId}`);
        res.status(200).json(user.favorites);
    } catch (err) {
        console.error(`[createFavorite] error: ${err.message}`);
        res.status(400).json({ message: err.message });
    }
}

async function readFavorites(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.favorites);
    } catch (err) {
        console.error(`[readFavorites] error: ${err.message}`);
        res.status(400).json({ message: err.message });
    }
}

async function deleteFavorite(req, res) {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            console.warn(`[deleteFavorite] user not found for id ${req.userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const idx = user.favorites.indexOf(req.body.songId);
        if (idx === -1) {
            console.log(`[deleteFavorite] song ${req.body.songId} not in favorites for user ${req.userId}`);
            return res.status(200).json(user.favorites);
        }

        user.favorites.splice(idx, 1);
        await user.save();
        console.log(`[deleteFavorite] user ${req.userId} removed song ${req.body.songId}`);
        res.status(200).json(user.favorites);
    } catch (err) {
        console.error(`[deleteFavorite] error: ${err.message}`);
        res.status(400).json({ message: err.message });
    }
}

async function getSong(req, res) {
    try {
        console.log(`[getSong] request from user ${req.userId}: "${req.body.message}"`);
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an assistant who helps recommend music to users! You should respond to users with a single and specific song recommendation. Even if you do not know what the user is asking for recommend a song. Even if the user asks for multiple songs, only give one song at a time. Try to recommend a song as recent as possible. Your response should ALWAYS look like this NO MATTER WHAT: explanation of why you think this song would be good for the user and then the songs you recommend in json format: {"songName": "songName", "artistName": "artistName"}' },
                { role: 'user', content: req.body.message },
            ],
            model: 'gpt-3.5-turbo',
        });

        const aiResponse = completion.choices[0].message.content;
        const songObjIndex = aiResponse.indexOf('{');
        const songObj = JSON.parse(aiResponse.slice(songObjIndex));
        const songExplanation = aiResponse.slice(0, songObjIndex);
        console.log(`[getSong] AI recommended: "${songObj.songName}" by ${songObj.artistName}`);

        const token = await getSpotifyToken();
        const searchRes = await fetch(
            `https://api.spotify.com/v1/search?q=remaster%2520track%3A${songObj.songName}%252520artist%253A${songObj.artistName}&type=track`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();

        if (!searchData.tracks?.items?.length) {
            console.warn(`[getSong] no spotify results for "${songObj.songName}" by ${songObj.artistName}`);
            return res.status(404).json({ message: 'No Spotify results found' });
        }

        const songId = searchData.tracks.items[0].id;
        console.log(`[getSong] spotify match: track id ${songId}`);
        res.status(200).json([songExplanation, songId]);
    } catch (err) {
        console.error(`[getSong] error: ${err.message}`);
        res.status(400).json({ message: err.message });
    }
}
