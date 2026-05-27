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
        const token = await getSpotifyToken();
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!trackRes.ok) {
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
        res.status(500).json({ message: err.message });
    }
}

async function createFavorite(req, res) {
    try {
        const user = await User.findOne({ email: req.body.email });
        user.favorites.push(req.body.songId);
        await user.save();
        res.status(200).json(user.favorites);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function readFavorites(req, res) {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).json(user.favorites);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function deleteFavorite(req, res) {
    try {
        const user = await User.findById(req.body.id);
        const idx = user.favorites.indexOf(req.body.songId);
        if (idx > -1) user.favorites.splice(idx, 1);
        await user.save();
        res.status(200).json(user.favorites);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function getSong(req, res) {
    try {
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

        const token = await getSpotifyToken();
        const searchRes = await fetch(
            `https://api.spotify.com/v1/search?q=remaster%2520track%3A${songObj.songName}%252520artist%253A${songObj.artistName}&type=track`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();
        const songId = searchData.tracks.items[0].id;

        res.status(200).json([songExplanation, songId]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
