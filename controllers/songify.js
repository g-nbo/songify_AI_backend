const Message = require('../models/Message');
const OpenAI = require('openai');
const User = require('../models/User');
const openai = new OpenAI();

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

module.exports = {
    getSong,
    createFavorite,
    readFavorites,
    deleteFavorite
};

// Add a favorite to users favorite array in db
async function createFavorite(req, res) {
    try {

        const user = await User.findOne({ email: req.body.email })

        const favorites = user.favorites

        const songId = req.body.songId

        favorites.push(songId)
        user.save();

        res.status(200).json(favorites);
    } catch (err) {
        res.status(400).json(err);
    }
}

// Find users favorite array and send back as res
async function readFavorites(req, res) {
    try {
        const user = await User.findById(req.params.id)

        const favorites = user.favorites

        res.status(200).json(favorites);
    } catch (err) {
        res.status(400).json(err);
    }
}

// Delete a single desired favorite from users favorites array
async function deleteFavorite(req, res) {
    try {
        const user = await User.findById(req.body.id)
        const favoriteIndex = user.favorites.indexOf(req.body.favorite)

        user.favorites.splice(favoriteIndex, 1)
        user.save()

        res.status(200).json(user.favorites)
    } catch (err) {
        res.status(400).json(err)
    }

}

// This is how users gets recommended a song
async function getSong(req, res) {
    try {

        const message = req.body

        // Retrieve AI Response to users message
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: 'You are an assistant who helps recommend music to users! You should respond to users with a single and specific song recommendation. Even if you do not know what the user is asking for recommend a song. Even if the user asks for multiple songs, only give one song at a time. Try to recommend a song as recent as possible. Your response should ALWAYS look like this NO MATTER WHAT: explanation of why you think this song would be good for the user and then the songs you recommend in json format: {"songName": "songName", "artistName": "artistName"' },
                { role: "user", content: message.message }
            ],
            model: "gpt-3.5-turbo",
        });

        // Seperate AI resposne into its useful parts and categorize by use
        const aiResponse = completion.choices[0].message.content
        const songObjIndex = aiResponse.indexOf("{")
        const songObj = aiResponse.slice(songObjIndex)
        const songExplanation = aiResponse.slice(0, songObjIndex)


        // Retrieve spotify access token 
        // NOTE: Spotify access token resets every hour
        const spotifyAuth = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`

        })
        const authData = await spotifyAuth.json()


        // Search for song on Spotify based on GPT's response
        const spotifySearchRes = await fetch(`https://api.spotify.com/v1/search?q=remaster%2520track%3A${JSON.parse(songObj).songName}%252520artist%253A${JSON.parse(songObj).artistName}&type=track`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authData.access_token
            }
        })
        const searchData = await spotifySearchRes.json()

        // Grab the song id that resulted from the spotify search
        const songId = searchData.tracks.items[0].id

        // Send back GPT's explanation and recommended song id to front-end
        const songArr = [songExplanation, songId]
        res.status(200).json(songArr)

    } catch (err) {
        res.status(400).json(err)
    }
}

