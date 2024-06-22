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
        console.log(message)

        // Retrieve AI Response to user message
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a happy go lucky AI assistant who helps recommend music to users. You should respond to users with a single and specific song recommendation in json format: {songName: songName, artistName: artistName" },
                {role: "user", content: message.message }
            ],
            model: "gpt-3.5-turbo",
        });


        const songName = JSON.parse(completion.choices[0].message.content).songName
        const artist = JSON.parse(completion.choices[0].message.content).artist

        
        
        
        // Retrieve spotify access token
        const spotifyAuth = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`

        })
        const authData = await spotifyAuth.json()


        // Retrieve users search results
        const spotifySearchRes = await fetch(`https://api.spotify.com/v1/search?q=%25track%A3${songName}%2520artist%A3${artist}%25&type=track&limit=1`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authData.access_token
            }
        })

        const searchData = await spotifySearchRes.json()

        const songId = searchData.tracks.items[0].id
        
        console.log(songId)
        res.status(200).json(songId)
    } catch (err) {
        res.status(400).json(err)
    }
}