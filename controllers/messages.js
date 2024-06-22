const Message = require('../models/Message');
const OpenAI = require('openai')
const openai = new OpenAI();

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET


module.exports = {
    getMessages,
    createMessage,
    sendToAI,
    getSong
};

async function getMessages(req, res) {
    try {
        const messages = await Message.find({});

        res.status(200).json(messages);
    } catch (err) {
        res.status(400).json(err);
    }
}

async function createMessage(req, res) {
    try {
        const message = await Message.create(req.body);

        res.status(200).json(message);
    } catch (err) {
        res.status(400).json(err);
    }
}


async function sendToAI(req, res) {
    try {
        const message = req.body
        console.log(message)
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: message.message }],
            model: "gpt-3.5-turbo",
        });

        res.status(200).json(completion.choices[0].message.content);
    } catch (err) {
        res.status(400).json(err)
    }
}

async function getSong(req, res) {
    try {

        const message = req.body

        // Retrieve AI Response to user message
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: 'You are an assistant who helps recommend music to users! Your name is Songie, you should mention your name at the end of your explanation to users randomly for no reason at all. You should respond to users with a single and specific song recommendation. Your response should ALWAYS look like this NO MATTER WHAT: explanation of why you think this song would be good for the user and then the songs you recommend in json format: {"songName": "songName", "artistName": "artistName"' },
                {role: "user", content: message.message }
            ],
            model: "gpt-3.5-turbo",
        });

        const aiResponse = completion.choices[0].message.content
        const songObjIndex = aiResponse.indexOf("{")
        const songObj = aiResponse.slice(songObjIndex)
        const songExplanation = aiResponse.slice(0, songObjIndex)
        
        
        // Retrieve spotify access token
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
        const songId = searchData.tracks.items[0].id

        const songArr = [songExplanation, songId]
        
        res.status(200).json(songArr)
    } catch (err) {
        res.status(400).json(err)
    }
}